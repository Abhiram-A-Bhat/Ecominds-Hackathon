// Seeded demo accounts (from src/data/users.js), grouped by interface.
// Used by the login cards and the in-app "Switch interface" menu so a presenter
// can jump between the three interfaces in one click.
import { GraduationCapIcon as GraduationCap } from '@phosphor-icons/react/dist/csr/GraduationCap';
import { HardHatIcon as HardHat } from '@phosphor-icons/react/dist/csr/HardHat';
import { ShieldCheckIcon as ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck';

export const INTERFACES = [
  {
    role: 'STUDENT', title: 'Green Guardian', who: 'Students', icon: GraduationCap, color: '#34d399',
    pitch: 'Race for live campus tasks, keep an adopted plant alive, earn and spend EcoCredits.',
    features: ['Slide-to-claim task alarms', 'Adopt-a-Plant with weather-smart reminders', 'Anonymous Overseer seat', 'Rewards store'],
    accounts: [
      { name: 'Divyashree S.', meta: '3rd yr CSE · owns a Tulsi', id: '1RN22CS045', pw: 'divya@eco26', avatar: '👩‍💻' },
      { name: 'Abhiram', meta: '2nd yr ISE · no plant — can take rescues', id: '1RN23IS005', pw: 'abhiram@2005', avatar: '👨‍🎓' },
      { name: 'Ravi Kumar M.', meta: '2nd yr ME · owns a Hibiscus', id: '1RN23ME019', pw: 'ravi@eco26', avatar: '👨‍🔧' },
    ],
  },
  {
    role: 'STAFF', title: 'Eco Ranger', who: 'Staff', icon: HardHat, color: '#fb923c',
    pitch: 'Run the ground work: bins, empty-room alerts, e-waste intake and plant-care audits.',
    features: ['Collection routing', 'CCTV Sentinel → Guardian alarms', 'Overseer report review', 'AI material scanner'],
    accounts: [
      { name: 'Ramesh K.', meta: 'Ground Ops · Zone 2', id: 'ramesh', pw: 'ranger@2026', avatar: '👷' },
      { name: 'Lakshmi N.', meta: 'Lab 104 & Flora', id: 'lakshmi', pw: 'flora@2026', avatar: '👩‍🔧' },
    ],
  },
  {
    role: 'ADMIN', title: 'Earth Warden', who: 'Admins', icon: ShieldCheck, color: '#c084fc',
    pitch: 'See the whole campus: IoT telemetry, verification, compliance reports and the Overseer seat.',
    features: ['IoT digital twin', 'NAAC green audit', 'Chain-of-custody ledger', 'Overseer seat control'],
    accounts: [
      { name: 'Dr. Kavitha S.', meta: 'NAAC In-Charge', id: 'admin', pw: 'eco@admin2026', avatar: '👩‍🏫' },
      { name: 'Dr. Nayana C P', meta: 'E-Waste Coordinator', id: 'nayana', pw: 'ewaste@2026', avatar: '👩‍🔬' },
    ],
  },
];
