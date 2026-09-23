'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import {
  Globe,
  Users,
  MapPin,
  Sparkles,
  X,
  GraduationCap,
  Building2,
  Briefcase,
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
  Link2,
  MessageCircle,
} from 'lucide-react';
import {
  GLOBE_CLUSTERS,
  type GlobeCountryCluster,
  type GlobeAlumni,
} from '@/lib/globe-data';
import { getProvinceCoords } from '@/lib/thailand-province-coords';

// ─── Dynamic import (ssr: false) สำหรับ react-globe.gl ───────────────────────
const ReactGlobe = dynamic(() => import('react-globe.gl').then((m) => m.default ?? m), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 bg-slate-950">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-400/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-4 border-indigo-500/50 animate-spin" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-4 rounded-full bg-indigo-950/60 backdrop-blur-sm" />
      </div>
      <p className="text-cyan-300 text-sm font-bold tracking-wider animate-pulse">กำลังโหลดแผนที่โลกสมจริง 3D & เขตแดนจังหวัด...</p>
    </div>
  ),
});

export type MapMode = 'hometown' | 'workplace';
export type GlobeTheme = 'satellite' | 'night' | 'clean';

export interface MapPoint {
  id: number;
  name: string;
  avatar_url?: string;
  position?: string;
  company?: string;
  generation?: string;
  career_type?: string;
  student_status?: string;
  province_id: number;
  province_name: string;
  region: string;
  metro: boolean;
  is_international?: boolean;
  country_code?: string;
  flag?: string;
  lat?: number;
  lng?: number;
  city?: string;
  facebook_url?: string | null;
  line_id?: string | null;
}

export interface GlobePanelProps {
  hometownData?: MapPoint[];
  workplaceData?: MapPoint[];
}

// ─── Bangkok & Metro Provinces ──────────────────────────────────────────────
const METRO_PROVINCES = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'];

// ─── 3D Separated/Exploded Bangkok & Perimeter Coordinate Settings ───────────
const METRO_3D_ORIGIN = { lng: 100.45, lat: 13.80 };
const METRO_3D_TARGET = { lng: 93.20, lat: 13.80 };
const METRO_3D_SCALE = 2.8;

function transformCoords(
  coords: any,
  scale = METRO_3D_SCALE,
  origLng = METRO_3D_ORIGIN.lng,
  origLat = METRO_3D_ORIGIN.lat,
  targetLng = METRO_3D_TARGET.lng,
  targetLat = METRO_3D_TARGET.lat
): any {
  if (typeof coords[0] === 'number') {
    const [lng, lat] = coords;
    return [targetLng + (lng - origLng) * scale, targetLat + (lat - origLat) * scale];
  }
  return coords.map((c: any) => transformCoords(c, scale, origLng, origLat, targetLng, targetLat));
}

// ─── 2D World Map (โหมดแผนที่แบนราบทั่วโลก + รายจังหวัดไทย) ──────────────────
// สีและเส้นขอบใช้ชุดเดียวกับลูกโลก 3D (polygonCapColor / polygonStrokeColor ตอนซูมเข้าประเทศ)
// เพื่อให้หน้าตาแผนที่ 2D กับ 3D เหมือนกันเป๊ะไม่ว่าจะดูมุมมองไหน
function getThaiProvinceFill(count: number, isSelected: boolean, isHovered: boolean) {
  if (isSelected) return '#EC4899';
  if (isHovered) return '#E0F2FE';
  if (count >= 5) return '#0369A1';
  if (count >= 3) return '#0EA5E9';
  if (count >= 1) return '#BAE6FD';
  return '#FFFFFF';
}

function getThaiProvinceStroke(count: number, isSelected: boolean) {
  if (isSelected) return '#FFFFFF';
  if (count > 0) return '#0284C7';
  return '#CBD5E1';
}

function getCountryFill(hasCluster: boolean, isSelected: boolean, isHovered: boolean) {
  if (!hasCluster) return isHovered ? '#F1F5F9' : '#FFFFFF';
  if (isSelected) return '#BAE6FD';
  return isHovered ? '#EEF2FF' : '#E0E7FF';
}

function getCountryStroke(hasCluster: boolean, isSelected: boolean) {
  if (!hasCluster) return '#CBD5E1';
  if (isSelected) return '#0284C7';
  return '#94A3B8';
}

// แปลงพิกัดภูมิศาสตร์ (lng, lat) เป็นตำแหน่ง x, y บนผืนผ้าใบ SVG แบบ Equirectangular
// (เส้นแวง/ลองจิจูด -180..180 → 0..width, เส้นรุ้ง/ละติจูด 90..-90 → 0..height)
const WORLD_MAP_VIEWBOX = { width: 960, height: 480 };

function projectLngLat(lng: number, lat: number): [number, number] {
  const x = (lng + 180) * (WORLD_MAP_VIEWBOX.width / 360);
  const y = (90 - lat) * (WORLD_MAP_VIEWBOX.height / 180);
  return [x, y];
}

// แปลงรูปทรง GeoJSON (Polygon / MultiPolygon) ให้เป็นคำสั่งวาด SVG path โดยฉาย
// พิกัดแต่ละจุดด้วยฟังก์ชัน projectLngLat ด้านบน
function geoJsonToSvgPath(geometry: any): string {
  if (!geometry) return '';
  const ringToPath = (ring: number[][]) =>
    ring
      .map(([lng, lat]: number[], i: number) => {
        const [x, y] = projectLngLat(lng, lat);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(4)},${y.toFixed(4)}`;
      })
      .join(' ') + ' Z';

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ringToPath).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((poly: number[][][]) => poly.map(ringToPath).join(' ')).join(' ');
  }
  return '';
}

// หาขอบเขต (bounding box) ของรูปทรง GeoJSON ในหน่วยพิกัด SVG (หลังฉายด้วย projectLngLat)
function getGeometryBBox(geometry: any): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visitRing = (ring: number[][]) => {
    for (const [lng, lat] of ring) {
      const [x, y] = projectLngLat(lng, lat);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  };
  if (geometry?.type === 'Polygon') {
    geometry.coordinates.forEach(visitRing);
  } else if (geometry?.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly: number[][][]) => poly.forEach(visitRing));
  } else {
    return null;
  }
  if (!isFinite(minX) || !isFinite(minY)) return null;
  return { minX, minY, maxX, maxY };
}

// หาผืนเขตแดนประเทศจาก ISO code โดยตรง (ไม่พึ่ง COUNTRY_GEO_MAP ที่มีแค่ ~15 ประเทศ)
// ให้ครอบคลุมทุกประเทศที่มีอยู่จริงในข้อมูล GeoJSON เวลาต้องซูมเข้าบนแผนที่ 2D
function findFeatureByCountryCode(polygons: any[], countryCode?: string) {
  if (!countryCode) return undefined;
  return polygons.find((f: any) => {
    const p = f.properties || {};
    if (p.isProvince) return false;
    const iso2 = p.ISO_A2;
    const iso3 = p.ISO_A3 || p.ADM0_A3;
    return (iso2 && iso2 !== '-99' && iso2 === countryCode) || iso3 === countryCode;
  });
}

type ViewBoxBox = { x: number; y: number; width: number; height: number };

// ขยายกรอบขอบเขต (bbox) ที่จะซูมเข้า ให้มีสัดส่วนตรงกับสัดส่วนกรอบแสดงผลจริง (containerAspect)
// พอดีเป๊ะ (เติมด้านที่แคบกว่าให้ยาวขึ้นเท่านั้น ไม่มีทางบีบอัดจนภาพเบี้ยว) เพื่อให้ตอนซูมเข้า
// เนื้อหาเต็มกรอบพอดีไม่มีขอบว่างเหลือ (letterbox)
function fitBBoxToAspect(
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  containerAspect: number,
  pad: number
): ViewBoxBox {
  const bw = Math.max((bbox.maxX - bbox.minX) * pad, 24);
  const bh = Math.max((bbox.maxY - bbox.minY) * pad, 12);
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  let w = bw;
  let h = bh;
  if (w / h > containerAspect) {
    h = w / containerAspect;
  } else {
    w = h * containerAspect;
  }
  return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
}

// แอนิเมต viewBox ของ SVG ให้ค่อยๆ เลื่อน/ซูมจากตำแหน่งเดิมไปตำแหน่งใหม่อย่างนุ่มนวลเมื่อ
// target เปลี่ยน (เช่น คลิกเลือกประเทศใหม่) และเปิดทางให้ตั้งค่าตำแหน่งเองได้ทันที (สำหรับ
// การลากเลื่อน/สกอลซูมด้วยเมาส์ ซึ่งไม่ต้องการแอนิเมตหน่วงเวลา)
function useAnimatedViewBox(target: ViewBoxBox): [ViewBoxBox, (next: ViewBoxBox) => void] {
  const [box, setBox] = useState(target);
  const boxRef = useRef(target);
  const lastTargetRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  const setManual = useCallback((next: ViewBoxBox) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    boxRef.current = next;
    lastTargetRef.current = next;
    setBox(next);
  }, []);

  useEffect(() => {
    const last = lastTargetRef.current;
    const changed =
      last.x !== target.x || last.y !== target.y || last.width !== target.width || last.height !== target.height;
    if (!changed) return;
    lastTargetRef.current = target;

    const from = { ...boxRef.current };
    const to = target;
    const duration = 650;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutCubic(t);
      const next: ViewBoxBox = {
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        width: from.width + (to.width - from.width) * e,
        height: from.height + (to.height - from.height) * e,
      };
      boxRef.current = next;
      setBox(next);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.x, target.y, target.width, target.height]);

  return [box, setManual];
}

const FULL_WORLD_BBOX = { minX: 0, minY: 0, maxX: WORLD_MAP_VIEWBOX.width, maxY: WORLD_MAP_VIEWBOX.height };

// จำกัดไม่ให้ลากเลื่อนออกนอกขอบโลกไปไกลเกินจำเป็น (เผื่อระยะไว้ครึ่งหนึ่งของขนาดวิวพอร์ตปัจจุบัน)
function clampPanToWorld(vb: ViewBoxBox): ViewBoxBox {
  const panMargin = Math.max(vb.width, vb.height) * 0.5;
  const loX = FULL_WORLD_BBOX.minX - panMargin;
  const hiX = Math.max(loX, FULL_WORLD_BBOX.maxX + panMargin - vb.width);
  const loY = FULL_WORLD_BBOX.minY - panMargin;
  const hiY = Math.max(loY, FULL_WORLD_BBOX.maxY + panMargin - vb.height);
  return { ...vb, x: Math.min(Math.max(vb.x, loX), hiX), y: Math.min(Math.max(vb.y, loY), hiY) };
}

function World2DMap({
  polygons,
  activeClusters,
  countryLevelClusters,
  selectedCluster,
  selectedArea,
  pins,
  containerAspect,
  onClickThaiProvince,
  onClickCountry,
}: {
  polygons: any[];
  activeClusters: GlobeCountryCluster[];
  countryLevelClusters: GlobeCountryCluster[];
  selectedCluster: GlobeCountryCluster | null;
  selectedArea: GlobeCountryCluster | null;
  pins: any[];
  containerAspect: number;
  onClickThaiProvince: (provinceName: string) => void;
  onClickCountry: (cluster: GlobeCountryCluster) => void;
}) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ label: string; count: number; flag: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; containerWidth: number } | null>(null);
  const aspect = containerAspect > 0 ? containerAspect : WORLD_MAP_VIEWBOX.width / WORLD_MAP_VIEWBOX.height;

  // แปลงเขตแดนทุกผืน (ประเทศทั่วโลก + 77 จังหวัดไทย) เป็น path ล่วงหน้าครั้งเดียว
  const paths = useMemo(
    () => polygons.map((feature: any, idx: number) => ({ key: `wp-${idx}`, feature, d: geoJsonToSvgPath(feature.geometry) })),
    [polygons]
  );

  // ─── หาขอบเขตของประเทศ/จังหวัดที่กำลังเลือกอยู่ เพื่อคำนวณการซูมเข้า ─────────
  const zoomBBox = useMemo(() => {
    if (selectedArea?.country_code === 'TH') {
      const feature = polygons.find((f: any) => f.properties?.isProvince && f.properties?.name_th === selectedArea.city);
      if (feature) return getGeometryBBox(feature.geometry);
    }

    if (selectedCluster) {
      if (selectedCluster.country_code === 'TH') {
        // รวมขอบเขตของทุกจังหวัดไทยเป็นกรอบเดียว (ซูมเข้าทั้งประเทศ)
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let found = false;
        for (const f of polygons) {
          if (f.properties?.isProvince) {
            const b = getGeometryBBox(f.geometry);
            if (b) {
              found = true;
              minX = Math.min(minX, b.minX);
              minY = Math.min(minY, b.minY);
              maxX = Math.max(maxX, b.maxX);
              maxY = Math.max(maxY, b.maxY);
            }
          }
        }
        return found ? { minX, minY, maxX, maxY } : null;
      }

      const feature =
        findFeatureByCountryCode(polygons, selectedCluster.country_code) ||
        polygons.find((f: any) => getClusterForFeature(f, activeClusters)?.country_code === selectedCluster.country_code);
      if (feature) {
        const bbox = getGeometryBBox(feature.geometry);
        if (bbox) return bbox;
      }

      // ไม่พบเขตแดนประเทศนี้ในข้อมูล (เช่น รหัสประเทศไม่ตรงมาตรฐาน ISO) → ซูมไปที่พิกัดหมุดแทน
      const [cx, cy] = projectLngLat(selectedCluster.lng, selectedCluster.lat);
      const halfW = 45;
      const halfH = 30;
      return { minX: cx - halfW, minY: cy - halfH, maxX: cx + halfW, maxY: cy + halfH };
    }

    return null;
  }, [selectedArea, selectedCluster, polygons, activeClusters]);

  // มุมมองเริ่มต้น (ทั้งโลก) ปรับสัดส่วนให้พอดีกรอบแสดงผลเสมอ ไม่มีขอบว่าง
  const baseWindow = useMemo(() => fitBBoxToAspect(FULL_WORLD_BBOX, aspect, 1), [aspect]);

  // มุมมองเป้าหมาย: ถ้าเลือกประเทศ/จังหวัดอยู่ → ซูมเข้ากรอบนั้นให้เต็มกรอบพอดี (เว้นขอบเล็กน้อย)
  const targetWindow = useMemo(
    () => (zoomBBox ? fitBBoxToAspect(zoomBBox, aspect, 1.2) : baseWindow),
    [zoomBBox, aspect, baseWindow]
  );

  const [viewBox, setViewBoxManual] = useAnimatedViewBox(targetWindow);

  // อัตราส่วนการซูมปัจจุบัน เทียบกับมุมมองทั้งโลก ใช้หดหมุด/เส้นขอบให้มีขนาดคงที่บนจอเสมอ
  const zoomRatio = baseWindow.width / viewBox.width;
  const inverseScale = 1 / zoomRatio;

  // ─── สกอลเมาส์ซูมเข้า/ออก + ลากเลื่อนแผนที่ด้วยเมาส์/นิ้ว ───────────────────
  const svgRef = useRef<SVGSVGElement>(null);
  const latestRef = useRef({ viewBox, aspect, baseWindowWidth: baseWindow.width });
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    latestRef.current = { viewBox, aspect, baseWindowWidth: baseWindow.width };
  });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSvgSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── ป้อปอัพค้างแสดงข้อมูลของประเทศ/จังหวัดที่ "เลือกอยู่" (ตอนคลิก ไม่ใช่แค่ hover) ─
  // อ้างอิงตำแหน่งจาก zoomBBox (ขอบเขตจริงของพื้นที่ที่เลือก) แปลงผ่าน viewBox ปัจจุบัน
  // ทำให้ป้อปอัพเกาะติดรูปทรงถูกต้องเสมอ ไม่ว่าจะกำลังเล่นแอนิเมชันซูมอยู่หรือไม่
  const selectedPopup = useMemo(() => {
    const item = selectedArea || selectedCluster;
    if (!item || !zoomBBox || svgSize.width === 0 || svgSize.height === 0) return null;
    const cx = (zoomBBox.minX + zoomBBox.maxX) / 2;
    const topY = zoomBBox.minY;
    const screenX = ((cx - viewBox.x) / viewBox.width) * svgSize.width;
    const screenY = ((topY - viewBox.y) / viewBox.height) * svgSize.height;
    return {
      label: selectedArea ? selectedArea.city : item.country_name,
      count: item.count,
      flag: item.flag,
      x: screenX,
      y: screenY,
    };
  }, [selectedArea, selectedCluster, zoomBBox, viewBox, svgSize]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const { viewBox: cur, aspect: asp, baseWindowWidth } = latestRef.current;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const mouseSvgX = cur.x + px * cur.width;
      const mouseSvgY = cur.y + py * cur.height;

      const factor = Math.exp(-e.deltaY * 0.0015);
      const minWidth = 8;
      const maxWidth = baseWindowWidth;
      const newWidth = Math.min(Math.max(cur.width / factor, minWidth), maxWidth);
      const newHeight = newWidth / asp;
      const scaleChange = newWidth / cur.width;
      const newX = mouseSvgX - (mouseSvgX - cur.x) * scaleChange;
      const newY = mouseSvgY - (mouseSvgY - cur.y) * scaleChange;

      setViewBoxManual(clampPanToWorld({ x: newX, y: newY, width: newWidth, height: newHeight }));
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [setViewBoxManual]);

  // ใช้ window listener แทน setPointerCapture เพื่อไม่ให้เบราว์เซอร์ redirect click ของปุ่ม/เส้น
  // เขตแดนที่กดอยู่ข้างในไปตกที่ <svg> เอง (ทำให้กดหมุด/เขตแดนแล้วไม่มีอะไรเกิดขึ้น)
  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const svgEl = e.currentTarget;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startBox = latestRef.current.viewBox;
    const dragState = { moved: false };
    setIsDragging(true);

    const onMove = (ev: PointerEvent) => {
      const rect = svgEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dxPx = ev.clientX - startClientX;
      const dyPx = ev.clientY - startClientY;
      if (Math.abs(dxPx) > 3 || Math.abs(dyPx) > 3) dragState.moved = true;
      const dxUnits = -(dxPx / rect.width) * startBox.width;
      const dyUnits = -(dyPx / rect.height) * startBox.height;
      setViewBoxManual(
        clampPanToWorld({
          x: startBox.x + dxUnits,
          y: startBox.y + dyUnits,
          width: startBox.width,
          height: startBox.height,
        })
      );
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      setIsDragging(false);
      if (dragState.moved) {
        suppressClickRef.current = true;
        setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleGuardedClick = (fn: () => void) => () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    fn();
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className={`w-full h-full touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={handlePointerDown}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top, containerWidth: rect.width });
        }}
      >
        <rect x={-2000} y={-2000} width={4000} height={4000} fill="#EFF6FF" />

        {paths.map(({ key, feature, d }) => {
          const p = feature.properties || {};
          const isThaiProvince = !!p.isProvince && !!p.name_th;

          let count = 0;
          let isSelected = false;
          let label = '';
          let flag = '🌐';
          let fill: string;
          let stroke: string;

          if (isThaiProvince) {
            label = p.name_th;
            flag = '🇹🇭';
            count = activeClusters.find((c) => c.country_code === 'TH' && c.city === label)?.count ?? 0;
            isSelected = selectedArea?.country_code === 'TH' && selectedArea?.city === label;
            fill = getThaiProvinceFill(count, isSelected, hoveredLabel === label);
            stroke = getThaiProvinceStroke(count, isSelected);
          } else {
            const c = getClusterForFeature(feature, activeClusters);
            label = c ? c.country_name : p.NAME || p.NAME_LONG || '';
            if (c) {
              flag = c.flag || '🌐';
              count = countryLevelClusters.find((x) => x.country_code === c.country_code)?.count ?? c.count;
              isSelected = !!selectedCluster && !selectedArea && selectedCluster.country_code === c.country_code;
            }
            fill = getCountryFill(!!c, isSelected, hoveredLabel === label);
            stroke = getCountryStroke(!!c, isSelected);
          }

          return (
            <path
              key={key}
              d={d}
              fill={fill}
              stroke={stroke}
              strokeWidth={isSelected ? 1.3 : 0.8}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              shapeRendering="geometricPrecision"
              onMouseEnter={() => {
                setHoveredLabel(label);
                setHoverInfo({ label, count, flag });
              }}
              onMouseLeave={() => {
                setHoveredLabel(null);
                setHoverInfo(null);
              }}
              onClick={handleGuardedClick(() => {
                if (isThaiProvince) {
                  onClickThaiProvince(label);
                  return;
                }
                const c = getClusterForFeature(feature, activeClusters);
                if (c) {
                  const matched = countryLevelClusters.find((x) => x.country_code === c.country_code) || c;
                  onClickCountry(matched);
                }
              })}
              className="cursor-pointer transition-colors duration-150"
            />
          );
        })}

        {/* หมุดปักตำแหน่งประเทศ/จังหวัด ย่อ/ขยายกลับให้ขนาดคงที่บนจอเสมอไม่ว่าจะซูมแค่ไหน */}
        {pins.map((pin: any) => {
          const [x, y] = projectLngLat(pin.lng, pin.lat);
          const isCountryLevel = !!pin.isCountryLevel;
          const isSelected = isCountryLevel
            ? selectedCluster?.country_code === pin.country_code
            : selectedArea?.city === pin.city && selectedArea?.country_code === pin.country_code;
          const boxW = 160;
          const boxH = 36;

          return (
            <foreignObject
              key={`${pin.country_code}-${pin.city}`}
              x={x - boxW / 2}
              y={y - boxH}
              width={boxW}
              height={boxH}
              style={{ overflow: 'visible', pointerEvents: 'none' }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  transform: `scale(${inverseScale})`,
                  transformOrigin: 'bottom center',
                }}
              >
                <button
                  onClick={handleGuardedClick(() => {
                    if (isCountryLevel) {
                      const matched = countryLevelClusters.find((c) => c.country_code === pin.country_code) || pin;
                      onClickCountry(matched);
                    } else if (pin.country_code === 'TH') {
                      onClickThaiProvince(pin.city);
                    } else {
                      onClickCountry(pin);
                    }
                  })}
                  style={{ pointerEvents: 'auto' }}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap border shadow-sm transition-transform hover:scale-110 cursor-pointer ${
                    isSelected
                      ? 'z-20 scale-110 bg-pink-600 text-white border-pink-600'
                      : isCountryLevel
                      ? 'z-10 bg-slate-900/90 text-white border-slate-700'
                      : 'z-10 bg-cyan-600/90 text-white border-cyan-500'
                  }`}
                >
                  <span>{pin.flag}</span>
                  <span>{isCountryLevel ? pin.country_name : pin.city}</span>
                  <span className="rounded-full bg-black/25 px-1.5">{pin.count}</span>
                </button>
              </div>
            </foreignObject>
          );
        })}
      </svg>

      {/* ป้อปอัพลอยตามเมาส์ตอน hover เขตแดน/จังหวัด (แทนทูลทิปเบราว์เซอร์ default) */}
      {hoverInfo && mousePos && (
        <div
          className="pointer-events-none absolute z-30 flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-slate-900/95 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y + 16,
            transform: mousePos.x > mousePos.containerWidth - 160 ? 'translateX(-100%)' : undefined,
          }}
        >
          <span className="text-base leading-none">{hoverInfo.flag}</span>
          <div className="flex flex-col">
            <span className="whitespace-nowrap">{hoverInfo.label}</span>
            <span className="text-[11px] font-semibold text-cyan-300">
              {hoverInfo.count > 0 ? `👥 ${hoverInfo.count} คน • คลิกเพื่อดู` : 'ยังไม่มีศิษย์เก่า'}
            </span>
          </div>
        </div>
      )}

      {/* ป้อปอัพค้างแสดงหลังคลิกเลือกประเทศ/จังหวัด ลอยเหนือรูปทรงที่เลือกอยู่เสมอ */}
      {selectedPopup && (
        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-[calc(100%+10px)]"
          style={{ left: selectedPopup.x, top: selectedPopup.y }}
        >
          <div className="flex items-center gap-2 rounded-xl border border-pink-400/60 bg-slate-900/95 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md whitespace-nowrap">
            <span className="text-base leading-none">{selectedPopup.flag}</span>
            <div className="flex flex-col">
              <span>{selectedPopup.label}</span>
              <span className="text-[11px] font-semibold text-pink-300">
                {selectedPopup.count > 0 ? `👥 ${selectedPopup.count} คน` : 'ยังไม่มีศิษย์เก่า'}
              </span>
            </div>
          </div>
          {/* ลูกศรชี้ลงไปที่รูปทรงที่เลือก */}
          <div className="mx-auto h-2.5 w-2.5 -translate-y-1 rotate-45 bg-slate-900/95 border-r border-b border-pink-400/60" />
        </div>
      )}
    </div>
  );
}

// ─── Regional Colors ─────────────────────────────────────────────────────────
const REGION_COLORS: Record<GlobeCountryCluster['region'], { ring: string; glow: string; bg: string; label: string }> = {
  thailand:   { ring: '#06B6D4', glow: 'rgba(6,182,212,0.35)',  bg: '#ECFEFF', label: 'ไทย' },
  asia:       { ring: '#10B981', glow: 'rgba(16,185,129,0.35)', bg: '#ECFDF5', label: 'เอเชีย' },
  americas:   { ring: '#F59E0B', glow: 'rgba(245,158,11,0.35)', bg: '#FFFBEB', label: 'อเมริกา' },
  europe:     { ring: '#A855F7', glow: 'rgba(168,85,247,0.35)', bg: '#FAF5FF', label: 'ยุโรป' },
  oceania:    { ring: '#22C55E', glow: 'rgba(34,197,94,0.35)',  bg: '#F0FDF4', label: 'โอเชียเนีย' },
  middleeast: { ring: '#EF4444', glow: 'rgba(239,68,68,0.35)',  bg: '#FEF2F2', label: 'ตะวันออกกลาง' },
};

// ─── Natural Earth Country Name / ISO Mapping ────────────────────────────────
const COUNTRY_GEO_MAP: Record<string, string[]> = {
  TH: ['TH', 'THA', 'Thailand'],
  JP: ['JP', 'JPN', 'Japan'],
  SG: ['SG', 'SGP', 'Singapore'],
  US: ['US', 'USA', 'United States of America', 'United States'],
  AU: ['AU', 'AUS', 'Australia'],
  DE: ['DE', 'DEU', 'Germany'],
  GB: ['GB', 'GBR', 'United Kingdom'],
  CA: ['CA', 'CAN', 'Canada'],
  KR: ['KR', 'KOR', 'South Korea', 'Korea, Republic of'],
  NL: ['NL', 'NLD', 'Netherlands'],
  FR: ['FR', 'FRA', 'France'],
  CH: ['CH', 'CHE', 'Switzerland'],
  AE: ['AE', 'ARE', 'United Arab Emirates'],
  CN: ['CN', 'CHN', 'China'],
  TW: ['TW', 'TWN', 'Taiwan'],
};

function getClusterForFeature(feature: any, clusters: GlobeCountryCluster[]): GlobeCountryCluster | undefined {
  const p = feature.properties || {};
  if (p.isProvince && p.name_th) {
    return clusters.find((c) => c.country_code === 'TH' && c.city === p.name_th);
  }

  const iso2 = p.ISO_A2;
  const iso3 = p.ISO_A3 || p.ADM0_A3;
  const name = p.NAME || p.NAME_LONG;

  for (const [code, aliases] of Object.entries(COUNTRY_GEO_MAP)) {
    if (
      (iso2 && iso2 !== '-99' && aliases.includes(iso2)) ||
      (iso3 && aliases.includes(iso3)) ||
      (name && aliases.includes(name))
    ) {
      return clusters.find((c) => c.country_code === code);
    }
  }
  return undefined;
}

// ─── การ์ดศิษย์เก่า ──────────────────────────────────────────────────────────
function AlumniCard({ alumni, onClick }: { alumni: GlobeAlumni; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-300 transition-all group cursor-pointer active:scale-[0.99] shadow-2xs hover:shadow-sm"
    >
      <div className="relative shrink-0">
        {alumni.avatar_url ? (
          <img
            src={alumni.avatar_url}
            alt={alumni.name}
            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-200/80 group-hover:ring-indigo-400 transition-all shadow-2xs"
          />
        ) : (
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-2xs">
            {alumni.name.charAt(0)}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
          <GraduationCap className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 justify-between">
          <p className="text-slate-900 font-extrabold text-sm truncate group-hover:text-indigo-600 transition-colors">
            {alumni.name}
          </p>
          {alumni.generation && (
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-700 text-[11px] font-black">
              {alumni.generation}
            </span>
          )}
        </div>
        <p className="text-slate-600 text-xs truncate mt-0.5 font-medium">{alumni.position || 'ศิษย์เก่า CSMJU'}</p>
        {alumni.company && (
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <p className="text-slate-500 text-xs truncate">{alumni.company}</p>
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-cyan-600 font-bold">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{alumni.city}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Modal แสดงโปรไฟล์ศิษย์เก่าฉบับเต็ม ─────────────────────────────────────────
function AlumniProfileModal({
  alumni,
  onClose,
}: {
  alumni: GlobeAlumni;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white p-6 sm:p-7 shadow-2xl rounded-[32px] border border-slate-100 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Profile Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            {alumni.avatar_url ? (
              <img
                src={alumni.avatar_url}
                alt={alumni.name}
                className="h-28 w-28 rounded-3xl object-cover mx-auto ring-4 ring-indigo-100 shadow-md"
              />
            ) : (
              <div className="h-28 w-28 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-4xl flex items-center justify-center mx-auto ring-4 ring-indigo-100 shadow-md">
                {alumni.name.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border-2 border-white">
              <GraduationCap className="h-3 w-3" /> ศิษย์เก่า CSMJU
            </span>
          </div>

          <div className="pt-1">
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1">
              {alumni.generation && (
                <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-0.5 text-xs font-black rounded-full border border-indigo-100">
                  {alumni.generation}
                </span>
              )}
              <span className="inline-block bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-bold rounded-full">
                {alumni.country_name}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{alumni.name}</h2>
            <p className="text-xs text-indigo-600 font-bold mt-0.5 flex items-center justify-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{alumni.city} • {alumni.country_name}</span>
            </p>
          </div>
        </div>

        {/* Job & Location Details */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3 text-left">
          {alumni.position && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mt-0.5">
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ตำแหน่งงาน</p>
                <p className="text-sm font-extrabold text-slate-800 break-words">{alumni.position}</p>
              </div>
            </div>
          )}

          {alumni.company && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 mt-0.5">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">บริษัท / หน่วยงาน</p>
                <p className="text-sm font-extrabold text-slate-800 break-words">{alumni.company}</p>
              </div>
            </div>
          )}

          {alumni.career_type && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">กลุ่มสายอาชีพ</p>
                <p className="text-sm font-extrabold text-slate-800 break-words">{alumni.career_type}</p>
              </div>
            </div>
          )}
        </div>

        {(alumni.facebook_url || alumni.line_id) && (
          <div className="flex items-center justify-center gap-2.5">
            {alumni.facebook_url && (
              <span className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                <Link2 className="h-3.5 w-3.5" /> Facebook: {alumni.facebook_url}
              </span>
            )}
            {alumni.line_id && (
              <span className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                <MessageCircle className="h-3.5 w-3.5" /> LINE: {alumni.line_id}
              </span>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
}

export function GlobePanel({
  hometownData = [],
  workplaceData = [],
}: GlobePanelProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 720, height: 620 });
  const [mode, setMode] = useState<MapMode>('hometown');
  const [mapView, setMapView] = useState<'3d' | '2d'>('3d');
  const [globeTheme] = useState<GlobeTheme>('clean');
  const [selectedCluster, setSelectedCluster] = useState<GlobeCountryCluster | null>(null);
  const [selectedArea, setSelectedArea] = useState<GlobeCountryCluster | null>(null);
  const [selectedAlumnus, setSelectedAlumnus] = useState<GlobeAlumni | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [globeReady, setGlobeReady] = useState(false);
  const [allPolygons, setAllPolygons] = useState<any[]>([]);


  // ─── Fetch GeoJSON: World Countries + Thailand 77 Provinces ─────────────────
  useEffect(() => {
    Promise.all([
      fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
        .then((r) => r.json())
        .catch(() => ({ features: [] })),
      fetch('/thailand-provinces.geojson')
        .then((r) => r.json())
        .catch(() => ({ features: [] })),
    ]).then(([worldData, thaiData]) => {
      // Filter out Thailand from world polygon so Thailand is divided into all 77 real province territories!
      const otherCountries = (worldData.features || []).filter((f: any) => {
        const p = f.properties || {};
        const iso = p.ISO_A2 || p.ISO_A3;
        const name = p.NAME || p.NAME_LONG;
        return iso !== 'TH' && iso !== 'THA' && name !== 'Thailand';
      });

      // Mark Thai features with isProvince = true and ensure name_th is present
      const thaiProvinces = (thaiData.features || []).map((f: any) => ({
        ...f,
        properties: {
          ...f.properties,
          isProvince: true,
          country_code: 'TH',
        },
      }));

      // สร้างรูปทรง 3D แยกขยายสำหรับ กทม. และ 5 จังหวัดปริมณฑล ในน่านน้ำทะเลอันดามัน
      const metro3DProvinces = (thaiData.features || [])
        .filter((f: any) => METRO_PROVINCES.includes(f.properties?.name_th))
        .map((f: any) => ({
          type: 'Feature',
          properties: {
            ...f.properties,
            isProvince: true,
            isMetro3D: true,
            country_code: 'TH',
            name_th: f.properties?.name_th,
            name: `${f.properties?.name_th} (3D ขยาย)`,
          },
          geometry: {
            type: f.geometry.type,
            coordinates: transformCoords(f.geometry.coordinates),
          },
        }));

      setAllPolygons([...otherCountries, ...thaiProvinces, ...metro3DProvinces]);
    });
  }, []);

  // Responsive container measurement
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setDimensions({
          width: w,
          height: Math.max(560, Math.min(Math.round(w * 0.85), 680)),
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ─── Dynamically Build Clusters from Thailand DB + International DB ─────────
  const activeClusters = useMemo(() => {
    const rawIntlClusters = GLOBE_CLUSTERS.filter((c) => c.country_code !== 'TH');
    const source = mode === 'hometown' ? hometownData : workplaceData;

    if (!source || source.length === 0) {
      return GLOBE_CLUSTERS;
    }

    const thaiPoints: MapPoint[] = [];
    const intlPoints: MapPoint[] = [];

    for (const p of source) {
      const isIntl =
        p.is_international ||
        p.region === 'ต่างประเทศ' ||
        (p.country_code && p.country_code !== 'TH') ||
        p.province_name?.includes('ต่างประเทศ') ||
        p.province_name?.includes('Japan') ||
        p.province_name?.includes('Singapore') ||
        p.province_name?.includes('USA') ||
        p.province_name?.includes('Australia') ||
        p.province_name?.includes('Germany') ||
        p.province_name?.includes('UK');

      if (isIntl) {
        intlPoints.push(p);
      } else {
        thaiPoints.push(p);
      }
    }

    // Group Thai database alumni by province
    const provMap = new Map<string, MapPoint[]>();
    for (const p of thaiPoints) {
      const pName = p.province_name || (p as any).provinceName;
      if (!pName) continue;
      const list = provMap.get(pName) ?? [];
      list.push(p);
      provMap.set(pName, list);
    }

    const thaiClusters: GlobeCountryCluster[] = Array.from(provMap.entries()).map(
      ([provName, people]) => {
        const coords = getProvinceCoords(provName);
        return {
          country_code: 'TH',
          country_name: 'ประเทศไทย',
          city: provName,
          lat: coords.lat,
          lng: coords.lng,
          count: people.length,
          flag: '🇹🇭',
          alumni: people.map((a) => ({
            id: a.id,
            name: a.name,
            avatar_url: a.avatar_url,
            position: a.position,
            company: a.company,
            generation: a.generation,
            career_type: a.career_type,
            facebook_url: a.facebook_url,
            line_id: a.line_id,
            country_code: 'TH',
            country_name: 'ประเทศไทย',
            city: provName,
            lat: coords.lat,
            lng: coords.lng,
            student_status: (a.student_status === 'studying' ? 'student' : 'alumni') as any,
          })),
          region: 'thailand',
        };
      }
    );

    // Deep clone intl clusters so we can augment them with real registered alumni
    const intlClusters: GlobeCountryCluster[] = rawIntlClusters.map((c) => ({
      ...c,
      alumni: [...c.alumni],
    }));

    for (const p of intlPoints) {
      let cluster = intlClusters.find(
        (c) =>
          (p.country_code && c.country_code === p.country_code) ||
          (p.province_name && (p.province_name.includes(c.country_name) || c.country_name.includes(p.province_name)))
      );

      const pLat = p.lat || cluster?.lat || 35.6762;
      const pLng = p.lng || cluster?.lng || 139.6503;
      const pCountryName = cluster?.country_name || p.province_name || 'ต่างประเทศ';
      const pCity = p.city || cluster?.city || pCountryName;

      const alumnusObj: GlobeAlumni = {
        id: p.id,
        name: p.name,
        avatar_url: p.avatar_url,
        position: p.position || 'ศิษย์เก่า CSMJU',
        company: p.company || 'องค์กรต่างประเทศ',
        generation: p.generation,
        career_type: p.career_type,
        facebook_url: p.facebook_url,
        line_id: p.line_id,
        country_code: p.country_code || cluster?.country_code || 'INTL',
        country_name: pCountryName,
        city: pCity,
        lat: pLat,
        lng: pLng,
        student_status: (p.student_status === 'studying' ? 'student' : 'alumni') as any,
      };

      if (cluster) {
        // Prepend so real registered alumnus shows at top
        cluster.alumni = [alumnusObj, ...cluster.alumni];
        cluster.count += 1;
      } else {
        const newCluster: GlobeCountryCluster = {
          country_code: p.country_code || 'INTL',
          country_name: pCountryName,
          city: pCity,
          lat: pLat,
          lng: pLng,
          count: 1,
          flag: p.flag || '🌐',
          alumni: [alumnusObj],
          region: 'asia',
        };
        intlClusters.push(newCluster);
      }
    }

    thaiClusters.sort((a, b) => b.count - a.count);
    return [...thaiClusters, ...intlClusters];
  }, [mode, hometownData, workplaceData]);

  // Clean light material fallback
  const globeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.85,
      metalness: 0.02,
    });
  }, []);

  // Globe ready callback
  const handleGlobeReady = useCallback(() => {
    setGlobeReady(true);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 14, lng: 101, altitude: 2.0 }, 0);
    }
  }, []);

  // ─── ซูมเข้าไปยังประเทศ (Country Level) ──────────────────────────────────────
  const handleZoomCountry = useCallback((cluster: GlobeCountryCluster) => {
    setSelectedCluster(cluster);
    setSelectedArea(null);
    setIsZoomedIn(true);
    setAutoRotate(false);
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: cluster.lat, lng: cluster.lng, altitude: 0.32 },
        1400
      );
    }
  }, []);

  // ─── ซูมเจาะจงลึกเข้าไปยังพื้นที่ / จังหวัดนั้นๆ (Area Level) ─────────────────
  const handleSelectArea = useCallback((area: GlobeCountryCluster) => {
    setSelectedCluster(area);
    setSelectedArea(area);
    setIsZoomedIn(true);
    setAutoRotate(false);
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: area.lat, lng: area.lng, altitude: 0.16 },
        1200
      );
    }
  }, []);

  // ซูมออกกลับมุมมองประเทศ
  const handleResetToCountry = useCallback(() => {
    if (!selectedCluster) return;
    setSelectedArea(null);
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: selectedCluster.lat, lng: selectedCluster.lng, altitude: 0.32 },
        1200
      );
    }
  }, [selectedCluster]);

  // ซูมออกกลับภาพรวมโลก
  const handleResetZoom = useCallback(() => {
    setSelectedCluster(null);
    setSelectedArea(null);
    setIsZoomedIn(false);
    setAutoRotate(true);
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: 14, lng: 101, altitude: 2.1 },
        1400
      );
    }
  }, []);

  // รายชื่อพื้นที่ในประเทศที่เลือก
  const countryAreas = useMemo(() => {
    if (!selectedCluster) return [];
    return activeClusters.filter((c) => c.country_code === selectedCluster.country_code);
  }, [selectedCluster, activeClusters]);

  // รายชื่อศิษย์เก่าที่จะแสดง
  const displayedAlumni = useMemo(() => {
    if (!selectedCluster) return [];
    if (selectedArea) {
      const match = activeClusters.find(
        (c) => c.country_code === selectedArea.country_code && c.city === selectedArea.city
      );
      return match ? match.alumni : [];
    }
    return countryAreas.flatMap((c) => c.alumni);
  }, [selectedCluster, selectedArea, countryAreas, activeClusters]);

  const selectedCountryTotalCount = countryAreas.reduce((sum, c) => sum + c.count, 0);

  // ─── รวบรวมข้อมูลระดับประเทศ (Country Level) สำหรับมุมมองตอนซูมออก ───────────
  const countryLevelClusters = useMemo(() => {
    const map = new Map<string, GlobeCountryCluster & { isCountryLevel?: boolean }>();
    for (const c of activeClusters) {
      const existing = map.get(c.country_code);
      if (!existing) {
        let cLat = c.lat;
        let cLng = c.lng;
        // พิกัดศูนย์กลางประเทศไทย
        if (c.country_code === 'TH') {
          cLat = 14.8;
          cLng = 100.8;
        }
        map.set(c.country_code, {
          country_code: c.country_code,
          country_name: c.country_name,
          city: c.country_name,
          lat: cLat,
          lng: cLng,
          count: c.count,
          flag: c.flag,
          alumni: [...c.alumni],
          region: c.region,
          isCountryLevel: true,
        });
      } else {
        existing.count += c.count;
        existing.alumni.push(...c.alumni);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [activeClusters]);

  // ─── คลิกจังหวัดไทย (ใช้ร่วมกันทั้งเขตแดนบนลูกโลก 3D และแผนที่ 2D) ───────────
  const handleClickThaiProvince = useCallback(
    (provName: string) => {
      if (!isZoomedIn || selectedCluster?.country_code !== 'TH') {
        const thaiCountry = countryLevelClusters.find((c) => c.country_code === 'TH') || {
          country_code: 'TH',
          country_name: 'ประเทศไทย',
          city: 'ประเทศไทย',
          lat: 14.8,
          lng: 100.8,
          count: 0,
          flag: '🇹🇭',
          alumni: [],
          region: 'thailand' as const,
        };
        handleZoomCountry(thaiCountry);
        return;
      }

      const clusterMatch = activeClusters.find((c) => c.country_code === 'TH' && c.city === provName);
      if (clusterMatch) {
        handleSelectArea(clusterMatch);
      } else {
        const coords = getProvinceCoords(provName);
        handleSelectArea({
          country_code: 'TH',
          country_name: 'ประเทศไทย',
          city: provName,
          lat: coords.lat,
          lng: coords.lng,
          count: 0,
          flag: '🇹🇭',
          alumni: [],
          region: 'thailand',
        });
      }
    },
    [isZoomedIn, selectedCluster, countryLevelClusters, activeClusters, handleZoomCountry, handleSelectArea]
  );

  // ─── สลับมุมมองแผนที่ 2D/3D (คงตำแหน่งประเทศ/พื้นที่ที่เลือกไว้เดิม) ──────────
  const handleSetMapView = useCallback((view: '3d' | '2d') => {
    setMapView(view);
  }, []);

  // ─── ข้อมูลศิษย์เก่าในเขต กทม. และปริมณฑล สำหรับ Inset แยกขยาย ───────────────
  const metroClusters = useMemo(() => {
    return METRO_PROVINCES.map((pName) => {
      const match = activeClusters.find((c) => c.country_code === 'TH' && c.city === pName);
      if (match) return match;
      const coords = getProvinceCoords(pName);
      return {
        country_code: 'TH',
        country_name: 'ประเทศไทย',
        city: pName,
        lat: coords.lat,
        lng: coords.lng,
        count: 0,
        flag: '🇹🇭',
        alumni: [],
        region: 'thailand' as const,
      };
    });
  }, [activeClusters]);

  const totalMetroAlumni = metroClusters.reduce((sum, c) => sum + c.count, 0);

  // ─── Polygons ที่จะแสดงบนลูกโลก 3D (รวมรูปทรง 3D แยกขยายเมื่อซูมเข้าดูประเทศไทย) ─
  const activePolygons = useMemo(() => {
    if (isZoomedIn && selectedCluster?.country_code === 'TH') {
      return allPolygons;
    }
    return allPolygons.filter((p: any) => !p.properties?.isMetro3D);
  }, [allPolygons, isZoomedIn, selectedCluster]);


  // ─── หมุดที่จะแสดงผลบนลูกโลก (รวมหมุด 3D Inset เมื่อซูมเข้าประเทศไทย) ─────────
  const displayedPins = useMemo(() => {
    // ถ้ายังไม่ได้ซูมเจาะจงประเทศใด -> แสดงเฉพาะหมุดระดับประเทศเท่านั้น!
    if (!isZoomedIn || !selectedCluster) {
      return countryLevelClusters;
    }

    // เมื่อกดเข้าประเทศใดแล้ว -> โชว์หมุดรายจังหวัด/พื้นที่ในประเทศนั้นๆ
    const currentCountryAreas = activeClusters.filter(
      (c) => c.country_code === selectedCluster.country_code
    );

    // รวมหมุดประเทศอื่นๆ ไว้เป็นจุดสังเกต
    const otherCountries = countryLevelClusters.filter(
      (c) => c.country_code !== selectedCluster.country_code
    );

    // ถ้ากำลังดูประเทศไทย ให้สร้างหมุด 3 มิติบนโซนแยกขยายด้วย
    if (selectedCluster.country_code === 'TH') {
      const metro3DPins = METRO_PROVINCES.map((pName) => {
        const orig = getProvinceCoords(pName);
        const transformed = transformCoords([orig.lng, orig.lat]);
        const match = activeClusters.find((c) => c.country_code === 'TH' && c.city === pName);
        return {
          country_code: 'TH',
          country_name: 'ประเทศไทย',
          city: pName,
          lat: transformed[1],
          lng: transformed[0],
          count: match?.count ?? 0,
          flag: '🏙️',
          alumni: match?.alumni ?? [],
          region: 'thailand' as const,
          isMetro3D: true,
        };
      });

      const headerPin = {
        country_code: 'TH',
        country_name: 'ประเทศไทย',
        city: 'กทม. และปริมณฑล (3D)',
        lat: METRO_3D_TARGET.lat + 2.1,
        lng: METRO_3D_TARGET.lng,
        count: totalMetroAlumni,
        flag: '🏙️',
        alumni: [],
        region: 'thailand' as const,
        isMetro3DHeader: true,
      };

      return [...currentCountryAreas, ...metro3DPins, headerPin, ...otherCountries];
    }

    return [...currentCountryAreas, ...otherCountries];
  }, [isZoomedIn, selectedCluster, countryLevelClusters, activeClusters, totalMetroAlumni]);

  // ─── เขตแดนสำหรับแผนที่ 2D ทั่วโลก (ตัดรูปทรง 3D แยกขยายที่ใช้เฉพาะโหมดลูกโลกออก) ─
  const flatPolygons = useMemo(
    () => allPolygons.filter((p: any) => !p.properties?.isMetro3D),
    [allPolygons]
  );

  // ─── หมุดสำหรับแผนที่ 2D ทั่วโลก (ตัดหมุด 3D Inset ที่ใช้เฉพาะโหมดลูกโลกออก) ──
  const flatPins = useMemo(
    () => displayedPins.filter((p: any) => !p.isMetro3D && !p.isMetro3DHeader),
    [displayedPins]
  );

  const uniqueCountriesWithAlumni = countryLevelClusters;
  const totalCountryCount = uniqueCountriesWithAlumni.length;
  const totalPinsCount = activeClusters.length;
  const totalAlumniInMode = activeClusters.reduce((sum, c) => sum + c.count, 0);

  const isDarkCanvas = mapView === '3d' && (globeTheme === 'satellite' || globeTheme === 'night');

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-hero text-white">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-blue-glow">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  CSMJU Global Network 🌍
                </h1>
                <p className="text-xs text-cyan-300 font-semibold">
                  แผนที่เครือข่ายศิษย์ทั่วโลก • คลิกเลือกประเทศเพื่อซูมดูรายจังหวัด
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              สำรวจศิษย์เก่าแม่โจ้ที่กำลังทำงานและสร้างชื่อเสียงในนานาประเทศทั่วทุกมุมโลก
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 self-stretch sm:self-auto">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-1 text-cyan-400 mb-0.5">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">ประเทศ</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">{totalCountryCount}</p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">พิกัดเมือง</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">{totalPinsCount}</p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">ศิษย์เก่า</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">{totalAlumniInMode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Control Bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-[28px] bg-white p-4 sm:p-5 border border-slate-200/80 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-xs">
            {([
              { key: 'hometown', label: '🏡 ภูมิลำเนา' },
              { key: 'workplace', label: '💼 สถานที่ทำงาน' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setMode(key);
                  setSelectedArea(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                  mode === key
                    ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 3D / 2D Map View Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-xs">
            <button
              onClick={() => handleSetMapView('3d')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                mapView === '3d'
                  ? 'bg-white text-cyan-700 shadow-md shadow-cyan-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>โลก 3D</span>
            </button>
            <button
              onClick={() => handleSetMapView('2d')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                mapView === '2d'
                  ? 'bg-white text-teal-700 shadow-md shadow-teal-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>แผนที่ 2D</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Globe + Side Panel ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_390px] items-start">

        {/* Globe Canvas Container */}
        <div
          ref={containerRef}
          className={`relative rounded-[32px] overflow-hidden shadow-hero w-full border ${
            isDarkCanvas ? 'bg-[#020617] border-slate-800' : 'bg-white border-slate-200'
          }`}
          style={{ height: dimensions.height }}
        >
          {/* Active Zoom Spotlight Banner */}
          {selectedCluster && isZoomedIn && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white border border-cyan-500/40 shadow-xl backdrop-blur-md max-w-[90%]">
              <span className="text-2xl sm:text-3xl shrink-0">{selectedCluster.flag}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <p className="text-cyan-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wide truncate">
                    {selectedArea ? `กำลังดูเขตพื้นที่: ${selectedArea.city}` : `กำลังดู: ${selectedCluster.country_name}`}
                  </p>
                </div>
                <p className="text-white text-xs sm:text-sm font-extrabold truncate">
                  {selectedArea ? `${selectedArea.city} (${selectedArea.count} คน)` : selectedCluster.country_name}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedArea && (
                  <button
                    onClick={handleResetToCountry}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
                    title="ดูทั้งประเทศ"
                  >
                    ทั้งประเทศ
                  </button>
                )}
                <button
                  onClick={handleResetZoom}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-cyan-500/30 cursor-pointer active:scale-95"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ซูมออก</span>
                </button>
              </div>
            </div>
          )}

          {/* Map Canvas Render (3D Globe or 2D World Map) */}
          <div className="w-full h-full flex items-center justify-center">
            {mapView === '2d' ? (
              <World2DMap
                polygons={flatPolygons}
                activeClusters={activeClusters}
                countryLevelClusters={countryLevelClusters}
                selectedCluster={selectedCluster}
                selectedArea={selectedArea}
                pins={flatPins}
                containerAspect={dimensions.width / dimensions.height}
                onClickThaiProvince={handleClickThaiProvince}
                onClickCountry={handleZoomCountry}
              />
            ) : (
            <ReactGlobe
              ref={globeRef}
              onGlobeReady={handleGlobeReady}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor={isDarkCanvas ? '#020617' : '#ffffff'}
              globeImageUrl={
                globeTheme === 'satellite'
                  ? '/textures/earth-blue-marble.jpg'
                  : globeTheme === 'night'
                  ? '/textures/earth-night.jpg'
                  : undefined
              }
              bumpImageUrl={
                isDarkCanvas ? '/textures/earth-topology.png' : undefined
              }
              showGlobe={true}
              globeMaterial={globeTheme === 'clean' ? globeMaterial : undefined}
              showGraticules={globeTheme === 'clean'}
              showAtmosphere={isDarkCanvas}
              atmosphereColor={globeTheme === 'night' ? '#6366f1' : '#38bdf8'}
              atmosphereAltitude={0.16}

              // ─── Polygons (แสดงเขตแดนทุกประเทศ + ฟ้าไล่เฉด + รูปทรง 3D แยกขยาย กทม. และปริมณฑล) ───────
              polygonsData={activePolygons}
              polygonGeoJsonGeometry={(d: any) => d.geometry}
              polygonCapColor={(d: any) => {
                const p = d.properties || {};
                const isThaiProv = p.isProvince;
                const provName = p.name_th;
                const isMetro3D = !!p.isMetro3D;

                // ถ้าเป็นจังหวัดของไทย (ทั้งบนแผ่นดินใหญ่และรูปทรง 3D แยกขยาย)
                if (isThaiProv) {
                  const isAreaSel = selectedArea?.city === provName;
                  const clusterMatch = activeClusters.find((c) => c.country_code === 'TH' && c.city === provName);
                  const count = clusterMatch?.count ?? 0;

                  if (isAreaSel) {
                    return '#ec4899'; // สีชมพูเน้นชัดเจนเมื่อเลือก
                  }
                  if (count >= 5) {
                    return isDarkCanvas ? 'rgba(3, 105, 161, 0.85)' : '#0369a1'; // ฟ้าเข้ม (หนาแน่นมาก)
                  }
                  if (count >= 3) {
                    return isDarkCanvas ? 'rgba(14, 165, 233, 0.70)' : '#0ea5e9'; // ฟ้าสด (ปานกลาง)
                  }
                  if (count >= 1) {
                    return isDarkCanvas ? 'rgba(56, 189, 248, 0.45)' : '#bae6fd'; // ฟ้าอ่อน (น้อย)
                  }
                  // จังหวัดที่ไม่มีคน: โชว์สีพื้นผิวสะอาด
                  return isMetro3D
                    ? (isDarkCanvas ? 'rgba(15, 23, 42, 0.85)' : '#f0f9ff')
                    : (isDarkCanvas ? 'rgba(255, 255, 255, 0.05)' : '#ffffff');
                }

                // ประเทศอื่นๆ ในโลก
                const c = getClusterForFeature(d, activeClusters);
                if (!c) return isDarkCanvas ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';
                if (selectedCluster?.country_code === c.country_code) {
                  return isDarkCanvas ? 'rgba(2, 132, 199, 0.60)' : '#bae6fd';
                }
                return isDarkCanvas ? 'rgba(6, 182, 212, 0.22)' : '#e0e7ff';
              }}
              polygonSideColor={(d: any) => {
                const p = d.properties || {};
                if (p.isMetro3D) {
                  const isAreaSel = selectedArea?.city === p.name_th;
                  return isAreaSel ? '#ec4899' : '#0284c7';
                }
                if (p.isProvince) {
                  const isAreaSel = selectedArea?.city === p.name_th;
                  return isAreaSel ? '#0284c7' : isDarkCanvas ? 'rgba(56, 189, 248, 0.3)' : '#cbd5e1';
                }
                return isDarkCanvas ? 'rgba(99, 102, 241, 0.3)' : '#cbd5e1';
              }}
              polygonStrokeColor={(d: any) => {
                const p = d.properties || {};
                const isThaiProv = p.isProvince;
                const provName = p.name_th;
                const isMetro3D = !!p.isMetro3D;

                if (isMetro3D) {
                  const isAreaSel = selectedArea?.city === provName;
                  return isAreaSel ? '#ffffff' : '#38bdf8';
                }

                // เส้นแบ่งเขตแดนแต่ละจังหวัดในไทย
                if (isThaiProv) {
                  const isAreaSel = selectedArea?.city === provName;
                  if (isAreaSel) return '#ffffff';
                  const clusterMatch = activeClusters.find((c) => c.country_code === 'TH' && c.city === provName);
                  if (clusterMatch && clusterMatch.count > 0) {
                    return isDarkCanvas ? '#38bdf8' : '#0284c7';
                  }
                  return isDarkCanvas ? 'rgba(255, 255, 255, 0.75)' : '#cbd5e1';
                }

                // เส้นขอบเขตประเทศ
                const c = getClusterForFeature(d, activeClusters);
                if (!c) return isDarkCanvas ? 'rgba(255, 255, 255, 0.35)' : '#cbd5e1';
                if (selectedCluster?.country_code === c.country_code) {
                  return '#0284c7';
                }
                return isDarkCanvas ? '#38bdf8' : '#94a3b8';
              }}
              // ความสูงระนาบ 3D: ให้เขต 3D ขยาย ลอยตัวสูงขึ้นอย่างสวยงาม
              polygonAltitude={(d: any) => {
                const p = d.properties || {};
                if (p.isMetro3D) {
                  return selectedArea?.city === p.name_th ? 0.024 : 0.014;
                }
                return selectedArea?.city === p.name_th ? 0.008 : 0.005;
              }}
              polygonLabel={(d: any) => {
                const p = d.properties || {};
                if (p.isProvince && p.name_th) {
                  const isMetro3D = !!p.isMetro3D;
                  const clusterMatch = activeClusters.find((c) => c.country_code === 'TH' && c.city === p.name_th);
                  const count = clusterMatch?.count ?? 0;

                  if (isMetro3D) {
                    return `
                      <div style="
                        background: rgba(15, 23, 42, 0.95);
                        color: #ffffff;
                        padding: 8px 12px;
                        border-radius: 12px;
                        border: 1.5px solid #38bdf8;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
                        font-family: inherit;
                        text-align: left;
                      ">
                        <div style="font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                          <span>🏙️</span>
                          <span>${p.name_th} (3D แยกขยาย)</span>
                        </div>
                        <div style="font-size: 11px; color: #38bdf8; margin-top: 3px; font-weight: 700;">
                          ${count > 0 ? `👥 ศิษย์เก่า ${count} ท่าน • แตะเพื่อดูรายชื่อ` : '📍 เขตแดน 3D ขยาย'}
                        </div>
                      </div>
                    `;
                  }

                  // ถ้ากำลังซูมดูประเทศไทยอยู่
                  if (isZoomedIn && selectedCluster?.country_code === 'TH') {
                    return `
                      <div style="
                        background: rgba(15, 23, 42, 0.95);
                        color: #ffffff;
                        padding: 8px 12px;
                        border-radius: 12px;
                        border: 1.5px solid rgba(56, 189, 248, 0.7);
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
                        font-family: inherit;
                        text-align: left;
                      ">
                        <div style="font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                          <span>🇹🇭</span>
                          <span>เขตจังหวัด${p.name_th}</span>
                        </div>
                        <div style="font-size: 11px; color: #38bdf8; margin-top: 3px; font-weight: 700;">
                          ${count > 0 ? `👥 ศิษย์เก่า ${count} ท่าน • แตะเพื่อดูรายชื่อ` : '📍 เขตแดนจังหวัด'}
                        </div>
                      </div>
                    `;
                  }
                  // ถ้ายังไม่ได้ซูมเข้าประเทศไทย โชว์ข้อมูลภาพรวมประเทศไทย
                  const thaiTotal = countryLevelClusters.find((c) => c.country_code === 'TH')?.count ?? 0;
                  return `
                    <div style="
                      background: rgba(15, 23, 42, 0.95);
                      color: #ffffff;
                      padding: 8px 12px;
                      border-radius: 12px;
                      border: 1.5px solid rgba(6, 182, 212, 0.7);
                      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
                      font-family: inherit;
                      text-align: left;
                    ">
                      <div style="font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                        <span>🇹🇭</span>
                        <span>ประเทศไทย (Thailand)</span>
                      </div>
                      <div style="font-size: 11px; color: #38bdf8; margin-top: 3px; font-weight: 700;">
                        👥 ศิษย์เก่ารวม ${thaiTotal} ท่าน • คลิกเพื่อซูมดูรายจังหวัด
                      </div>
                    </div>
                  `;
                }
                const c = getClusterForFeature(d, activeClusters);
                const name = p.NAME || p.NAME_LONG || (c ? c.country_name : 'ดินแดน');
                const count = c ? countryLevelClusters.find((x) => x.country_code === c.country_code)?.count ?? c.count : 0;
                return `
                  <div style="
                    background: rgba(15, 23, 42, 0.95);
                    color: #ffffff;
                    padding: 8px 12px;
                    border-radius: 12px;
                    border: 1.5px solid rgba(99, 102, 241, 0.7);
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
                    font-family: inherit;
                    text-align: left;
                  ">
                    <div style="font-weight: 800; font-size: 13px;">
                      ${c ? c.flag + ' ' : '🌐 '}${c ? c.country_name : name}
                    </div>
                    <div style="font-size: 11px; color: #818cf8; margin-top: 3px; font-weight: 700;">
                      ${count > 0 ? `👥 ศิษย์เก่า ${count} ท่าน • แตะเพื่อดู` : '🌍 คลิกเพื่อซูม'}
                    </div>
                  </div>
                `;
              }}
              polygonsTransitionDuration={300}
              onPolygonClick={(d: any) => {
                const p = d.properties || {};
                if (p.isProvince && p.name_th) {
                  handleClickThaiProvince(p.name_th);
                  return;
                }

                const c = getClusterForFeature(d, activeClusters);
                if (c) {
                  const matched = countryLevelClusters.find((x) => x.country_code === c.country_code) || c;
                  handleZoomCountry(matched);
                }
              }}

              // ─── Sleek Interactive Area Pins (ซูมออกโชว์แค่ประเทศ / ซูมเข้าโชว์จังหวัด) ───
              htmlElementsData={displayedPins}
              htmlLat="lat"
              htmlLng="lng"
              htmlAltitude={0.025}
              htmlElement={(d: any) => {
                const el = document.createElement('div');
                const isCountryLevel = !!d.isCountryLevel;
                const isMetro3DHeader = !!d.isMetro3DHeader;
                const isMetro3D = !!d.isMetro3D;
                const isAreaSel = !isCountryLevel && !isMetro3DHeader && selectedArea && selectedArea.city === d.city && selectedArea.country_code === d.country_code;
                const isCountrySel = isCountryLevel && selectedCluster && selectedCluster.country_code === d.country_code;
                const color = REGION_COLORS[d.region as GlobeCountryCluster['region']]?.ring ?? '#06B6D4';

                el.style.cssText = `
                  cursor: pointer;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  user-select: none;
                  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.45));
                  transform: ${isAreaSel ? 'scale(1.28) translateY(-8px)' : isCountrySel ? 'scale(1.15) translateY(-6px)' : isCountryLevel ? 'scale(1.08) translateY(-4px)' : 'scale(1) translateY(-2px)'};
                  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                  z-index: ${isAreaSel ? 50 : isCountrySel ? 40 : isMetro3DHeader ? 45 : isCountryLevel ? 30 : 20};
                `;

                if (isMetro3DHeader) {
                  // ป้ายหัวข้อ 3D Header สำหรับโซนแยกขยาย
                  el.innerHTML = `
                    <div style="
                      display: flex;
                      align-items: center;
                      gap: 6px;
                      background: linear-gradient(135deg, #0284c7, #4f46e5);
                      color: #ffffff;
                      border: 2px solid #38bdf8;
                      border-radius: 9999px;
                      padding: 4px 12px;
                      white-space: nowrap;
                      font-family: inherit;
                      box-shadow: 0 0 20px rgba(56,189,248,0.7);
                      backdrop-filter: blur(8px);
                    ">
                      <span style="font-size: 13px;">🏙️</span>
                      <span style="font-size: 11.5px; font-weight: 900; letter-spacing: -0.2px;">กทม. และปริมณฑล (3D แยกขยาย)</span>
                      <span style="
                        background: #0f172a;
                        color: #38bdf8;
                        font-size: 10px;
                        font-weight: 900;
                        padding: 1.5px 6.5px;
                        border-radius: 10px;
                        line-height: 1.3;
                        border: 1px solid #38bdf8;
                      ">${d.count} คน</span>
                    </div>
                  `;
                  return el;
                }

                if (isCountryLevel) {
                  // หมุดระดับประเทศ (ตอนซูมออก)
                  el.innerHTML = `
                    <div style="
                      display: flex;
                      align-items: center;
                      gap: 6px;
                      background: ${isCountrySel ? '#0369a1' : 'rgba(15, 23, 42, 0.92)'};
                      color: #ffffff;
                      border: ${isCountrySel ? '2px solid #38bdf8' : `1.8px solid ${color}`};
                      border-radius: 9999px;
                      padding: 3.5px 10px;
                      white-space: nowrap;
                      font-family: inherit;
                      box-shadow: ${isCountrySel ? '0 0 16px rgba(6,182,212,0.7)' : '0 4px 12px rgba(0,0,0,0.3)'};
                      backdrop-filter: blur(6px);
                    ">
                      <span style="font-size: 13px; line-height: 1;">${d.flag || '🌐'}</span>
                      <span style="font-size: 12px; font-weight: 800; letter-spacing: -0.2px;">${d.country_name}</span>
                      <span style="
                        background: ${isCountrySel ? '#164e63' : color};
                        color: #ffffff;
                        font-size: 10.5px;
                        font-weight: 900;
                        padding: 1.5px 6.5px;
                        border-radius: 10px;
                        line-height: 1.3;
                      ">${d.count}</span>
                    </div>
                    <div style="
                      width: 0;
                      height: 0;
                      border-left: 6px solid transparent;
                      border-right: 6px solid transparent;
                      border-top: 7px solid ${isCountrySel ? '#0e7490' : 'rgba(15, 23, 42, 0.92)'};
                      margin-top: -1px;
                    "></div>
                  `;
                } else {
                  // หมุดระดับจังหวัด/พื้นที่ (ตอนซูมเข้า และบนโซน 3D Inset)
                  el.innerHTML = `
                    <div style="
                      display: flex;
                      align-items: center;
                      gap: 5px;
                      background: ${isAreaSel ? '#ec4899' : isMetro3D ? 'rgba(15, 23, 42, 0.95)' : isCountrySel ? '#0e7490' : 'rgba(15, 23, 42, 0.9)'};
                      color: #ffffff;
                      border: ${isAreaSel ? '2px solid #ffffff' : isMetro3D ? '1.8px solid #38bdf8' : isCountrySel ? '2px solid #38bdf8' : `1.5px solid ${color}`};
                      border-radius: 9999px;
                      padding: 2.5px 8px;
                      white-space: nowrap;
                      font-family: inherit;
                      box-shadow: ${isAreaSel ? '0 0 20px rgba(236,72,153,0.9)' : isMetro3D ? '0 0 10px rgba(56,189,248,0.5)' : isCountrySel ? '0 0 12px rgba(6,182,212,0.6)' : 'none'};
                      backdrop-filter: blur(4px);
                    ">
                      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${isAreaSel ? '#ffffff' : isMetro3D ? '#38bdf8' : color};flex-shrink:0;"></span>
                      <span style="font-size: 11px; font-weight: 800; letter-spacing: -0.2px;">${d.city}</span>
                      <span style="
                        background:${isAreaSel ? '#9d174d' : isMetro3D ? '#0369a1' : isCountrySel ? '#164e63' : color};
                        color:#ffffff;
                        font-size: 10px;
                        font-weight: 900;
                        padding:1px 6px;
                        border-radius:10px;
                        line-height:1.3;
                      ">${d.count}</span>
                    </div>
                    <div style="
                      width: 0;
                      height: 0;
                      border-left: 5px solid transparent;
                      border-right: 5px solid transparent;
                      border-top: 6px solid ${isAreaSel ? '#ec4899' : isMetro3D ? '#0369a1' : isCountrySel ? '#0e7490' : color};
                      margin-top: -1px;
                    "></div>
                  `;
                }

                el.onclick = (e) => {
                  e.stopPropagation();
                  if (isCountryLevel) {
                    const matched = countryLevelClusters.find((c) => c.country_code === d.country_code) || d;
                    handleZoomCountry(matched);
                  } else {
                    handleSelectArea(d);
                  }
                };

                el.onmouseenter = () => {
                  el.style.transform = isCountryLevel ? 'scale(1.22) translateY(-6px)' : 'scale(1.32) translateY(-8px)';
                };
                el.onmouseleave = () => {
                  el.style.transform = isAreaSel
                    ? 'scale(1.28) translateY(-8px)'
                    : isCountrySel
                    ? 'scale(1.15) translateY(-6px)'
                    : isCountryLevel
                    ? 'scale(1.08) translateY(-4px)'
                    : 'scale(1) translateY(-2px)';
                };

                return el;
              }}

              enablePointerInteraction={true}
            />
            )}
          </div>


          {/* Auto-rotate indicator */}
          {mapView === '3d' && autoRotate && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-white shadow-sm backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold">กำลังหมุนโลก</span>
            </div>
          )}

          {/* Hint */}
          {(mapView === '3d' ? globeReady : true) && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-white shadow-sm backdrop-blur-sm">
              <span className="text-xs font-semibold">
                {mapView === '3d'
                  ? '🗺️ แตะที่เขตแดนหรือหมุดจังหวัดเพื่อดูศิษย์เก่า'
                  : '🗺️ แตะประเทศ/จังหวัดบนแผนที่ทั่วโลกเพื่อดูศิษย์เก่า'}
              </span>
            </div>
          )}
        </div>

        {/* ─── Right: Country Detail / Specific Area Alumni List ────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Active Zoomed Country / Area Details */}
          {selectedCluster && (
            <div className="relative rounded-[28px] bg-white border border-indigo-200/80 shadow-xl overflow-hidden animate-fade-in">
              <div
                className="absolute top-0 left-0 right-0 h-2 rounded-t-[28px]"
                style={{
                  background: selectedArea
                    ? '#0284c7'
                    : REGION_COLORS[selectedCluster.region]?.ring ?? '#06B6D4',
                }}
              />
              <div className="p-5">
                {/* Header with Country Flag & Name */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl sm:text-4xl leading-none shrink-0">{selectedCluster.flag}</span>
                    <div className="min-w-0">
                      <h3 className="text-slate-900 font-black text-lg sm:text-xl leading-tight truncate">
                        {selectedCluster.country_name}
                      </h3>
                      <p className="text-slate-500 text-xs font-medium truncate">
                        มีทั้งหมด {countryAreas.length} พื้นที่/เมือง • รวม {selectedCountryTotalCount} คน
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetZoom}
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                    title="ปิด / ซูมออกมุมมองโลก"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* ─── Area Selector Chips ────────────────────────────────────── */}
                {countryAreas.length > 1 && (
                  <div className="mb-3.5 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-600" />
                      <span>เลือกเจาะจงพื้นที่ ({countryAreas.length} จุด):</span>
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        onClick={handleResetToCountry}
                        className={`flex items-center gap-1 shrink-0 rounded-full px-3 py-1 text-xs font-extrabold transition-all cursor-pointer border ${
                          !selectedArea
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>🌐 ทุกพื้นที่</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          !selectedArea ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {selectedCountryTotalCount}
                        </span>
                      </button>

                      {countryAreas.map((area) => {
                        const isThisArea = selectedArea?.city === area.city;
                        return (
                          <button
                            key={`area-chip-${area.city}`}
                            onClick={() => handleSelectArea(area)}
                            className={`flex items-center gap-1 shrink-0 rounded-full px-3 py-1 text-xs font-extrabold transition-all cursor-pointer border ${
                              isThisArea
                                ? 'bg-pink-600 text-white border-pink-600 shadow-sm scale-105'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>📍 {area.city}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                              isThisArea ? 'bg-pink-800 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {area.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Status Bar */}
                <div className="flex items-center justify-between mb-3 p-3 rounded-2xl bg-cyan-50/80 border border-cyan-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-4 w-4 text-cyan-600 shrink-0" />
                    <span className="text-slate-900 font-extrabold text-xs sm:text-sm truncate">
                      {selectedArea ? (
                        <>ศิษย์เก่าในเขต <span className="text-pink-600 font-black">{selectedArea.city}</span> ({displayedAlumni.length} คน)</>
                      ) : (
                        <>ศิษย์เก่าใน {selectedCluster.country_name} ({displayedAlumni.length} คน)</>
                      )}
                    </span>
                  </div>
                  {selectedArea && (
                    <button
                      onClick={handleResetToCountry}
                      className="text-[11px] text-cyan-700 hover:text-cyan-900 font-bold underline shrink-0 cursor-pointer"
                    >
                      ดูทุกพื้นที่
                    </button>
                  )}
                </div>

                {/* Alumni List */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                  {displayedAlumni.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs font-medium">
                      ยังไม่มีศิษย์เก่าปักหมุดในพื้นที่นี้
                    </div>
                  )}
                  {displayedAlumni.map((a) => (
                    <AlumniCard
                      key={a.id}
                      alumni={a}
                      onClick={() => setSelectedAlumnus(a)}
                    />
                  ))}
                </div>

                {/* Switch map view button */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleSetMapView(mapView === '3d' ? '2d' : '3d')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-50 to-indigo-50 hover:from-cyan-100 hover:to-indigo-100 text-indigo-800 text-xs font-extrabold border border-indigo-100 transition-colors cursor-pointer"
                  >
                    {mapView === '3d' ? (
                      <>
                        <MapIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>สลับไปดูแผนที่ 2D {selectedArea?.city ? `(เน้น ${selectedArea.city})` : ''}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5 text-indigo-600" />
                        <span>สลับไปดูลูกโลก 3D</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Country & Area Pins Directory */}
          <div className="rounded-[28px] bg-white border border-slate-200/90 shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-600" />
                  <h2 className="font-extrabold text-slate-800 text-sm sm:text-base">พื้นที่และจังหวัดที่มีศิษย์เก่า</h2>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-xs">
                  {totalPinsCount} พื้นที่
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto scrollbar-hide">
              {activeClusters.map((cluster) => {
                const colors = REGION_COLORS[cluster.region] ?? { ring: '#06B6D4', bg: '#ECFEFF' };
                const isSelected = selectedArea?.city === cluster.city && selectedArea?.country_code === cluster.country_code;

                return (
                  <button
                    key={`${cluster.country_code}-${cluster.city}`}
                    onClick={() => handleSelectArea(cluster)}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left transition-all duration-150 cursor-pointer ${
                      isSelected ? 'bg-pink-50/90 border-l-4 border-pink-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{cluster.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1">
                        <span>{cluster.city}</span>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-pink-100 text-pink-700">
                            Active
                          </span>
                        )}
                      </p>
                      <p className="text-slate-400 text-xs truncate">{cluster.country_name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-extrabold px-2.5 py-1 rounded-full"
                        style={{ background: colors.bg, color: colors.ring, border: `1px solid ${colors.ring}30` }}
                      >
                        {cluster.count} คน
                      </span>
                      <ZoomIn className={`w-4 h-4 transition-colors ${isSelected ? 'text-pink-600' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-[24px] bg-white border border-slate-200/80 p-4 shadow-xs">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2.5">คำอธิบายสัญลักษณ์</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 rounded-full bg-white border border-slate-400" />
                <span className="text-slate-700 font-semibold">เส้นแบ่ง 77 จังหวัด</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 rounded-full bg-cyan-400" />
                <span className="text-slate-700 font-semibold">จังหวัดที่มีศิษย์เก่า</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-slate-700 font-semibold">พื้นที่ที่กำลังดู</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-700 font-semibold">Origin: ม.แม่โจ้</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Profile Modal ─────────────────────────────────────────────────── */}
      {selectedAlumnus && (
        <AlumniProfileModal
          alumni={selectedAlumnus}
          onClose={() => setSelectedAlumnus(null)}
        />
      )}
    </div>
  );
}
