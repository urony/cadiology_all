// ממיר את התמונות מתיקיית "תמונות לקרדיו" ל-WebP בתיקיית art, לפי מיפוי קבוע (תחילית שם הקובץ => שם יעד)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(root, '..', 'תמונות לקרדיו');
const MAP = [
  ['071936c8', 'mascot_happy', 600], ['2fd6b937', 'mascot_wow', 600], ['498e94ec', 'mascot_think', 600],
  ['35b96250', 'mascot_sad', 600], ['b774d9c1', 'mascot_wink', 600], ['ef7180bd', 'hero_bg', 1200],
  ['27fc5085', 'guide_ecg', 500], ['20cc1c18', 'guide_ldl', 500], ['648dc079', 'guide_af', 500],
  ['fc89d51b', 'anat_heart', 900], ['7b5a035e', 'anat_heart_cut', 900], 
  ['23fe7980', 'anat_coronary', 900], ['fa69d88f', 'anat_vessels', 1000], ['6d37c8ca', 'anat_conduction', 900], ['c55d1e14', 'anat_valves', 800], 
  ['e30e1ec9', 'plaque_1', 640], ['54b67e24', 'plaque_2', 640], ['c7844214', 'plaque_3', 640], ['da9f7ce6', 'plaque_4', 640],
  ['חתך בלב', 'heart_cut', 1000], ['כלליים ועוד', 'heart_coronary', 1000], ['angio_normal', 'angio_normal', 700], ['angio_stenosis', 'angio_stenosis', 700], ['stress_test', 'stress_test', 700], ['holter', 'holter', 600], ['stent', 'stent', 700], ['CABG', 'cabg', 700],
  ['e9dd1af4', 'mi_heart', 800], ['e2505d80', 'body_athero', 800],
  ['57d80a38', 'echo_normal', 800], ['a45dcd8f', 'echo_dilated', 800],
  ['b115bae3', 'xray_normal', 800], ['f76eb3e5', 'xray_edema', 800],
  ['0e3bd9dc', 'ct_normal', 700], ['6c51b14a', 'ct_hemorrhage', 700], ['download', 'ct_ischemic', 700],
  ['0fee6170', 'patient_c1', 500], ['eaf6ff92', 'patient_c2', 500], ['a174d617', 'patient_c3', 500], ['387a86ab', 'patient_c4', 500],
  ['f588dcf2', 'patient_c5', 500], ['f0278783', 'patient_c6', 500], ['848c65d9', 'patient_c7', 500], ['a19cbebf', 'patient_c8', 500],
  ['809171db', 'patient_c9', 500], ['7c8216e2', 'patient_c10', 500],
  ['ff62ab28', 'exam_c4', 800], ['01eed9e8', 'exam_c8', 800], ['02a344e2', 'exam_c9', 800],
];
const files = fs.readdirSync(src);
for (const [pre, name, w] of MAP) {
  const f = files.find(x => x.startsWith(pre));
  if (!f) { console.log('חסר:', pre, name); continue; }
  const out = path.join(root, 'art', name + '.webp');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(src, f), '-vf', `scale='min(${w},iw)':-2`, '-quality', '82', out]);
  console.log(name, Math.round(fs.statSync(out).size / 1024) + ' KB');
}
