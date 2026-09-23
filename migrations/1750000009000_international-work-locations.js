/* eslint-disable camelcase */

/**
 * Migration 009 — International Work Locations
 *
 * lookup_options (category='province') already carries is_international / country_code /
 * flag / city / lat / lng inside `extra`, and every layer that reads it — register page,
 * profile edit form (LocationPicker), map.service.ts's getHometownDistribution /
 * getWorkplaceDistribution — was already built to use those fields (see
 * src/services/db/lookup.service.ts:getAllProvinces). Nobody had ever seeded a single
 * international row though, so the "ต่างประเทศ" tab in the picker was always empty and
 * no alumni could actually select a country/city abroad.
 *
 * This seeds real cities (not fictional people) reusing the same coordinates already
 * hardcoded in src/lib/globe-data.ts's mock alumni set, so the globe's existing
 * region/arc math lines up with what people can now actually select. `label` is
 * "City, Country" so the LocationPicker's search (which only matches `label`) finds
 * a city by either its city or country name.
 *
 * The dev DB already had 15 country-level rows (codes 'intl-jp', 'intl-us', ...) plus
 * an 'intl-other' catch-all — untracked schema drift, not created by any migration in
 * this repo (same class of issue as the is_available_for_mentorship column found
 * earlier). Each one hid a single representative city behind a generic
 * "ประเทศ (English)" label with no way to tell them apart or pick a different city in
 * the same country. Nothing in `users` referenced them (checked before writing this),
 * so this migration removes them and replaces them with the proper city-level rows
 * below, keeping 'intl-other' as the fallback for a city that isn't listed.
 */

const OLD_COUNTRY_ONLY_CODES = [
  'intl-jp', 'intl-sg', 'intl-us', 'intl-au', 'intl-de', 'intl-gb', 'intl-ca',
  'intl-kr', 'intl-nl', 'intl-fr', 'intl-ch', 'intl-ae', 'intl-cn', 'intl-tw',
];

const CITIES = [
  { code: 'jp-tokyo', city: 'โตเกียว', country: 'ญี่ปุ่น', country_code: 'JP', flag: '🇯🇵', lat: 35.6762, lng: 139.6503 },
  { code: 'jp-osaka', city: 'โอซาก้า', country: 'ญี่ปุ่น', country_code: 'JP', flag: '🇯🇵', lat: 34.6937, lng: 135.5023 },
  { code: 'sg-singapore', city: 'สิงคโปร์', country: 'สิงคโปร์', country_code: 'SG', flag: '🇸🇬', lat: 1.3521, lng: 103.8198 },
  { code: 'us-siliconvalley', city: 'Silicon Valley', country: 'สหรัฐอเมริกา', country_code: 'US', flag: '🇺🇸', lat: 37.3382, lng: -121.8863 },
  { code: 'us-seattle', city: 'Seattle', country: 'สหรัฐอเมริกา', country_code: 'US', flag: '🇺🇸', lat: 47.6062, lng: -122.3321 },
  { code: 'us-boston', city: 'Boston', country: 'สหรัฐอเมริกา', country_code: 'US', flag: '🇺🇸', lat: 42.3601, lng: -71.0589 },
  { code: 'au-sydney', city: 'ซิดนีย์', country: 'ออสเตรเลีย', country_code: 'AU', flag: '🇦🇺', lat: -33.8688, lng: 151.2093 },
  { code: 'au-melbourne', city: 'เมลเบิร์น', country: 'ออสเตรเลีย', country_code: 'AU', flag: '🇦🇺', lat: -37.8136, lng: 144.9631 },
  { code: 'de-munich', city: 'มิวนิก', country: 'เยอรมนี', country_code: 'DE', flag: '🇩🇪', lat: 48.1351, lng: 11.5820 },
  { code: 'gb-london', city: 'ลอนดอน', country: 'สหราชอาณาจักร', country_code: 'GB', flag: '🇬🇧', lat: 51.5074, lng: -0.1278 },
  { code: 'ca-toronto', city: 'โตรอนโต', country: 'แคนาดา', country_code: 'CA', flag: '🇨🇦', lat: 43.6532, lng: -79.3832 },
  { code: 'kr-seoul', city: 'โซล', country: 'เกาหลีใต้', country_code: 'KR', flag: '🇰🇷', lat: 37.5665, lng: 126.9780 },
  { code: 'nl-amsterdam', city: 'อัมสเตอร์ดัม', country: 'เนเธอร์แลนด์', country_code: 'NL', flag: '🇳🇱', lat: 52.3676, lng: 4.9041 },
  { code: 'fr-paris', city: 'ปารีส', country: 'ฝรั่งเศส', country_code: 'FR', flag: '🇫🇷', lat: 48.8566, lng: 2.3522 },
  { code: 'ch-geneva', city: 'เจนีวา', country: 'สวิตเซอร์แลนด์', country_code: 'CH', flag: '🇨🇭', lat: 46.2044, lng: 6.1432 },
  { code: 'ae-dubai', city: 'ดูไบ', country: 'สหรัฐอาหรับเอมิเรตส์', country_code: 'AE', flag: '🇦🇪', lat: 25.2048, lng: 55.2708 },
  { code: 'cn-shenzhen', city: 'เซินเจิ้น', country: 'จีน', country_code: 'CN', flag: '🇨🇳', lat: 22.5431, lng: 114.0579 },
  { code: 'tw-taipei', city: 'ไทเป', country: 'ไต้หวัน', country_code: 'TW', flag: '🇹🇼', lat: 25.0330, lng: 121.5654 },
];

exports.up = async (pgm) => {
  for (const code of OLD_COUNTRY_ONLY_CODES) {
    await pgm.db.query(
      `DELETE FROM lookup_options
       WHERE category = 'province' AND code = $1
         AND NOT EXISTS (SELECT 1 FROM users WHERE province_option_id = lookup_options.id OR hometown_province_id = lookup_options.id OR work_province_id = lookup_options.id)`,
      [code]
    );
  }

  for (const c of CITIES) {
    const label = `${c.city}, ${c.country}`;
    const extra = {
      region: 'ต่างประเทศ',
      is_international: true,
      country_code: c.country_code,
      flag: c.flag,
      city: c.city,
      lat: c.lat,
      lng: c.lng,
    };
    await pgm.db.query(
      `INSERT INTO lookup_options (category, code, label, extra)
       VALUES ('province', $1, $2, $3::jsonb)
       ON CONFLICT (category, code) DO UPDATE SET label = EXCLUDED.label, extra = EXCLUDED.extra`,
      [`intl-${c.code}`, label, JSON.stringify(extra)]
    );
  }
};

exports.down = async (pgm) => {
  for (const c of CITIES) {
    await pgm.db.query(
      `DELETE FROM lookup_options
       WHERE category = 'province' AND code = $1
         AND NOT EXISTS (SELECT 1 FROM users WHERE province_option_id = lookup_options.id OR hometown_province_id = lookup_options.id OR work_province_id = lookup_options.id)`,
      [`intl-${c.code}`]
    );
  }
};
