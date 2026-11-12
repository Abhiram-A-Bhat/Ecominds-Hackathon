// ─── Pass-The-Torch: Hand-Me-Downs & Academic Gear Exchange ───────────────────
// Merged circular campus hub: Seniors donate notes, calculators, drafters & components.
// Juniors in need receive items for free; seniors earn verified EcoCredits.

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { Link } from '../router/Router';
import { IconRecycle, IconCheckCircle, IconZap, IconAward } from '../components/Icons';

const ITEM_CATEGORIES = [
  { value: 'ALL', label: 'All Items', icon: '🎒' },
  { value: 'UNIFORM', label: 'College Uniform & Blazers', icon: '👔', points: 65 },
  { value: 'NOTES', label: 'Lecture Notes', icon: '📓', points: 35 },
  { value: 'TEXTBOOK', label: 'Textbooks', icon: '📚', points: 50 },
  { value: 'CALCULATOR', label: 'Calculators', icon: '🔢', points: 60 },
  { value: 'ELECTRONICS', label: 'Electronic Kits', icon: '🔌', points: 70 },
  { value: 'LAB_GEAR', label: 'Lab Tools & Apparatus', icon: '🔬', points: 65 },
  { value: 'DRAWING', label: 'Mini Drafters & Boards', icon: '📐', points: 55 },
  { value: 'CLOTHING', label: 'Lab Coats & Aprons', icon: '🥼', points: 40 },
];

const POINTS_BY_CATEGORY = {
  UNIFORM: 65,
  NOTES: 35,
  TEXTBOOK: 50,
  CALCULATOR: 60,
  ELECTRONICS: 70,
  LAB_GEAR: 65,
  DRAWING: 55,
  CLOTHING: 40,
  OTHER: 30,
};

// In-memory persistent list of shared senior hand-me-downs & exchange items
let globalDonations = [
  {
    id: 'pt-106',
    title: 'Official RNSIT Navy Blue College Blazer (Size 38 / M)',
    category: 'UNIFORM',
    condition: 'Crisp & Dry-Cleaned — College crest intact with all brass buttons',
    description: 'Passed down to save a junior ₹2,400 on college formal dress code. Required for placement drives, formal college functions, and semester vivas.',
    donorName: 'Abhiram',
    donorUSN: '1RN23IS005',
    donorId: 'stu-abhiram',
    targetBranch: 'All Branches (Placement / Formal Vivas)',
    status: 'AVAILABLE',
    listedAt: 'Just now',
    pointsAwarded: 65,
    claimedBy: null,
  },
  {
    id: 'pt-107',
    title: 'RNSIT Formal Uniform Set (2 Shirts + 2 Trousers, Size 38)',
    category: 'UNIFORM',
    condition: 'Like New — Clean formal stripes, zero tears or fraying',
    description: 'Freshly laundered official college dress code set. Perfect for incoming 1st & 2nd year juniors.',
    donorName: 'Divyashree S.',
    donorUSN: '1RN22CS045',
    donorId: 'stu-001',
    targetBranch: '1st & 2nd Year Students',
    status: 'AVAILABLE',
    listedAt: 'Yesterday',
    pointsAwarded: 65,
    claimedBy: null,
  },
  {
    id: 'pt-108',
    title: 'Mechanical Workshop Boiler Suit & Safety Overalls (Size L)',
    category: 'UNIFORM',
    condition: 'Heavy-Duty Navy Drill Fabric — completely intact, no oil stains',
    description: 'Compulsory for 1st Year Mechanical Workshop & Fitting / Welding labs. Saves buying new protective boiler overalls.',
    donorName: 'Rohan Deshmukh',
    donorUSN: '1RN22ME044',
    donorId: 'stu-004',
    targetBranch: '1st Year Mech Cycle / ME / Civil',
    status: 'AVAILABLE',
    listedAt: '2 days ago',
    pointsAwarded: 60,
    claimedBy: null,
  },
  {
    id: 'pt-101',
    title: 'Engineering Graphics Mini Drafter + Drawing Board Kit',
    category: 'DRAWING',
    condition: 'Good Condition — all scales & clips working',
    description: 'Passed down from 3rd year CSE. Complete set with protector cover.',
    donorName: 'Sowmyashree S.',
    donorUSN: '1RN22CS078',
    donorId: 'stu-002',
    targetBranch: '1st Year All Branches',
    status: 'AVAILABLE',
    listedAt: 'Yesterday',
    pointsAwarded: 55,
    claimedBy: null,
  },
  {
    id: 'pt-102',
    title: 'Casio fx-991ES PLUS Scientific Calculator',
    category: 'CALCULATOR',
    condition: 'Excellent — fresh battery & crisp display',
    description: 'Passed down to help any 1st/2nd year student with engineering math.',
    donorName: 'Abhiram',
    donorUSN: '1RN23IS005',
    donorId: 'stu-abhiram',
    targetBranch: 'All Branches',
    status: 'AVAILABLE',
    listedAt: '2 days ago',
    pointsAwarded: 60,
    claimedBy: null,
  },
  {
    id: 'pt-103',
    title: 'Digital Electronics Lab Breadboard & Logic IC Kit',
    category: 'ELECTRONICS',
    condition: 'Gently Used — 74xx series gates & jumper wires included',
    description: 'Saves buying a ₹1,200 lab kit for 3rd semester digital electronics.',
    donorName: 'Harshitha P.',
    donorUSN: '1RN22EC032',
    donorId: 'stu-003',
    targetBranch: 'ECE / EEE / ISE',
    status: 'AVAILABLE',
    listedAt: '3 days ago',
    pointsAwarded: 70,
    claimedBy: null,
  },
  {
    id: 'pt-104',
    title: 'Data Structures & Algorithms in C Handwritten VTU Notes',
    category: 'NOTES',
    condition: 'Complete 5-Module Solved Notes with previous year questions',
    description: 'Includes module-wise tree and graph traversals with code snippets.',
    donorName: 'Divyashree S.',
    donorUSN: '1RN22CS045',
    donorId: 'stu-001',
    targetBranch: 'CSE / ISE',
    status: 'AVAILABLE',
    listedAt: '4 days ago',
    pointsAwarded: 35,
    claimedBy: null,
  },
  {
    id: 'pt-105',
    title: 'Chemistry Lab Protective White Coat (Size M)',
    category: 'CLOTHING',
    condition: 'Freshly Laundered — no stains or tears',
    description: 'Required for 1st year chemistry lab sessions.',
    donorName: 'Sowmyashree S.',
    donorUSN: '1RN22CS078',
    donorId: 'stu-002',
    targetBranch: '1st Year Chemistry Cycle',
    status: 'AVAILABLE',
    listedAt: '5 days ago',
    pointsAwarded: 40,
    claimedBy: null,
  },
];

const BRANCH_FILTERS = [
  { value: 'ALL', label: 'All Branches' },
  { value: '1st Year', label: '1st Year Cycle' },
  { value: 'CSE', label: 'CSE / ISE' },
  { value: 'ECE', label: 'ECE / EEE' },
  { value: 'Mech', label: 'Mech / Civil' },
];

export function ExchangePage({ userCredits, setUserCredits }) {
  const { currentUser, isAdmin, isStudent, addContribution, addDonation, addClaimedItem, approveContribution, getLiveUsers } = useAuth();
  const [items, setItems] = useState(globalDonations);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'browse');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  // Donation form state
  const [form, setForm] = useState({
    title: '',
    category: 'TEXTBOOK',
    condition: 'Good Condition',
    description: '',
    targetBranch: 'All Branches',
  });

  // Claim modal state
  const [claimingItem, setClaimingItem] = useState(null);
  const [claimNote, setClaimNote] = useState('');
  const [qrItemId, setQrItemId] = useState(null);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesBranch = selectedBranch === 'ALL' ||
      item.targetBranch.toLowerCase().includes(selectedBranch.toLowerCase()) ||
      item.targetBranch.toLowerCase().includes('all branches') ||
      item.targetBranch.toLowerCase().includes('any student');
    const matchesQuery = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.donorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesBranch && matchesQuery;
  });

  const availableItems = filteredItems.filter(i => i.status === 'AVAILABLE');
  const pendingItems = items.filter(i => i.status === 'PENDING_ADMIN');
  const myDonations = items.filter(i => i.donorId === currentUser?.id || i.donorUSN === currentUser?.usn);

  // Senior submits item to pass down
  const handleDonate = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const pts = POINTS_BY_CATEGORY[form.category] || 35;
    const newItem = {
      id: `pt-${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      condition: form.condition,
      description: form.description || 'Donated to help juniors at RNSIT.',
      donorName: currentUser?.name || 'Senior Student',
      donorUSN: currentUser?.usn || '1RN-SENIOR',
      donorId: currentUser?.id,
      targetBranch: form.targetBranch,
      status: 'AVAILABLE', // Instantly available on circular board
      listedAt: 'Just now',
      pointsAwarded: pts,
      claimedBy: null,
    };

    globalDonations = [newItem, ...globalDonations];
    setItems([newItem, ...items]);

    // Update user credits
    if (setUserCredits) {
      setUserCredits(prev => prev + pts);
    }

    if (addDonation) {
      addDonation({
        id: newItem.id,
        title: newItem.title,
        category: newItem.category,
        condition: newItem.condition,
        date: new Date().toLocaleDateString('en-IN'),
        status: 'AVAILABLE',
        points: pts,
      });
    }

    if (addContribution) {
      addContribution({
        action: `Passed Down: ${form.title}`,
        points: pts,
        type: 'HANDMEDOWN',
        status: 'APPROVED',
      });
    }

    triggerEcoCelebration({
      title: '🤝 Item Passed Down!',
      message: `"${form.title}" is now available for junior students. You earned +${pts} EcoCredits!`,
      points: pts,
      badge: `+${pts} EcoCredits`,
    });

    setForm({ title: '', category: 'TEXTBOOK', condition: 'Good Condition', description: '', targetBranch: 'All Branches' });
    setFormOpen(false);
    setActiveTab('browse');
  };

  // Junior claims an item
  const handleClaim = (item) => {
    const updated = items.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'CLAIMED',
          claimedBy: `${currentUser?.name || 'Student'} (${currentUser?.usn || '1RN'})`,
          claimedAt: new Date().toLocaleDateString('en-IN'),
        };
      }
      return i;
    });

    globalDonations = updated;
    setItems(updated);
    setClaimingItem(null);

    // Reward junior +10 EcoCredits and log in user history
    if (setUserCredits) {
      setUserCredits(prev => prev + 10);
    }

    if (addClaimedItem) {
      addClaimedItem(item);
    }

    if (addContribution) {
      addContribution({
        action: `Claimed Free Academic Gear: ${item.title}`,
        points: 10,
        type: 'HANDMEDOWN',
        status: 'APPROVED',
      });
    }

    triggerEcoCelebration({
      title: '🎉 Item Reserved for Free Pickup!',
      message: `You reserved "${item.title}". Collect it from ECE Lab 104 / Student Council Desk with your college ID!`,
      points: 10,
      badge: 'Free Claim Verified',
    });
  };

  return (
    <div className="space-y-6">
      {/* Friendly Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Pass-The-Torch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <span>🤝</span> Pass-The-Torch Circular Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Graduating seniors pass down notes, scientific calculators, mini-drafters, and lab apparatus to juniors — <strong>100% free</strong> for students in need!
          </p>
        </div>

        {/* Action Button */}
        {!isAdmin && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 self-start md:self-auto"
          >
            <span>{formOpen ? '✕ Close Form' : '+ Pass Down An Item (+EcoCredits)'}</span>
          </button>
        )}
      </div>

      {/* 3-Step Friendly Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="text-xl bg-emerald-500/10 border border-emerald-500/20 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
            🎁
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-300">1. Seniors Pass Down</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              List notes, calculators, blazers, or drafters in 30 seconds and earn up to +70 EcoCredits.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="text-xl bg-sky-500/10 border border-sky-500/20 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
            🔍
          </div>
          <div>
            <h4 className="text-xs font-bold text-sky-300">2. Staff Quality Check</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Drop items at ECE Lab 104 / Library Desk. Staff verify completeness and index by branch.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="text-xl bg-amber-500/10 border border-amber-500/20 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
            🎓
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-300">3. Juniors Claim Free</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              100% free for juniors in need. Reserve online and collect with your college ID card.
            </p>
          </div>
        </div>
      </div>

      {/* Helpful Student Need Banner */}
      {currentUser?.financialAid && (
        <div className="bg-slate-900 border border-sky-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="text-2xl">💙</div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-sky-200">Financial Aid Student Access Active</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              As a financial aid student, you have <strong>1st priority</strong> to claim calculators, drafters, and textbooks completely free. Select any item below and click &quot;Claim for Free&quot;.
            </p>
          </div>
          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold px-2.5 py-1 rounded-full">
            Priority Eligible
          </span>
        </div>
      )}

      {/* Pass Down Form Drawer */}
      {formOpen && (
        <form onSubmit={handleDonate} className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎁</span> Pass Down Used Academic Gear to Juniors
              </h3>
              <p className="text-xs text-slate-400">
                You will receive verified EcoCredits for extending the life of study materials!
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg">
              Earn +{POINTS_BY_CATEGORY[form.category] || 35} EcoCredits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Item Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Casio fx-991ES Calculator, Mini Drafter, VTU DSA Notes"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                {ITEM_CATEGORIES.filter(c => c.value !== 'ALL').map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Condition</label>
              <input
                type="text"
                placeholder="e.g. Gently used, complete keys, minor cover scuffs"
                value={form.condition}
                onChange={e => setForm({ ...form, condition: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Recommended For</label>
              <select
                value={form.targetBranch}
                onChange={e => setForm({ ...form, targetBranch: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="All Branches">All Branches / Any Student</option>
                <option value="1st Year Engineering">1st Year Engineering</option>
                <option value="CSE / ISE">CSE / ISE</option>
                <option value="ECE / EEE">ECE / EEE</option>
                <option value="Mechanical / Civil">Mechanical / Civil</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Helpful Notes for Juniors (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Handover available at Library ground floor or ECE Lab 104..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
            >
              Confirm & List Item (+{POINTS_BY_CATEGORY[form.category] || 35} PTS)
            </button>
          </div>
        </form>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🎒</span> Available Items ({availableItems.length})
          </button>

          {!isAdmin && (
            <button
              onClick={() => setActiveTab('my_items')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'my_items'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>📋</span> Items I Gave ({myDonations.length})
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-purple-300 hover:text-white border border-purple-500/30'
              }`}
            >
              <span>🛡️</span> Coordinator Overview ({items.length})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            aria-label="Search study materials, calculators, and notes"
            placeholder="Search notes, drafters, calculators..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Bars (When on Browse Tab) */}
      {activeTab === 'browse' && (
        <div className="space-y-2">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ITEM_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                  selectedCategory === cat.value
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Branch & Year Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Department:</span>
            {BRANCH_FILTERS.map(b => (
              <button
                key={b.value}
                onClick={() => setSelectedBranch(b.value)}
                className={`px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition ${
                  selectedBranch === b.value
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Browse Items */}
      {activeTab === 'browse' && (
        <div>
          {availableItems.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <div className="text-4xl">📦</div>
              <h3 className="text-sm font-bold text-white">No items found in this category</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first senior to pass down textbooks, notes, or calculators to your juniors!
              </p>
              {!isAdmin && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  + Pass Down An Item
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableItems.map(item => {
                const catMeta = ITEM_CATEGORIES.find(c => c.value === item.category) || { icon: '📦' };
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between transition shadow-lg space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>{catMeta.icon}</span> {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-950/40 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          Free for Juniors
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-800/60">
                        <div>✨ <strong>Condition:</strong> {item.condition}</div>
                        <div>🎓 <strong>Senior:</strong> {item.donorName} ({item.donorUSN})</div>
                        <div>🎯 <strong>Recommended:</strong> {item.targetBranch}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Listed {item.listedAt}
                      </span>
                      <button
                        onClick={() => setClaimingItem(item)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-md transition"
                      >
                        Claim for Free →
                      </button>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <button
                        onClick={() => setQrItemId(qrItemId === item.id ? null : item.id)}
                        style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', padding: '4px 10px', borderRadius: 8, cursor: 'pointer' }}
                      >
                        {qrItemId === item.id ? '✕ Hide QR' : '📱 Show QR Tag'}
                      </button>
                      {qrItemId === item.id && (
                        <div style={{ marginTop: 8, padding: 10, background: 'white', borderRadius: 10, display: 'inline-block' }}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=ECOSPHERE-${item.id}-${encodeURIComponent(item.title || item.name || '')}`}
                            alt="QR Code"
                            width={120} height={120}
                            style={{ display: 'block' }}
                          />
                          <div style={{ fontSize: 9, color: '#666', textAlign: 'center', marginTop: 4, fontFamily: 'monospace' }}>{item.id}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Items I Gave */}
      {activeTab === 'my_items' && (
        <div className="space-y-3">
          {myDonations.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
              <div className="text-3xl mb-2">🤝</div>
              <p className="text-xs">You haven&apos;t passed down any items yet.</p>
              <button
                onClick={() => setFormOpen(true)}
                className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                + Pass Down Your 1st Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myDonations.map(d => (
                <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{d.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{d.condition}</p>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">
                      +{d.pointsAwarded || 35} EcoCredits Awarded
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    d.status === 'CLAIMED' 
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {d.status === 'CLAIMED' ? 'Claimed by Junior' : 'Active on Board'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Admin Review */}
      {activeTab === 'admin' && isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Pass-The-Torch All Listings (Staff View)</h3>
              <p className="text-xs text-slate-400">Oversee student exchanges and verify apparatus condition at Lab 104 intake desk.</p>
            </div>
            <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-lg">
              Total {items.length} Circular Items
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {items.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400">
                    Donor: {item.donorName} ({item.donorUSN}) • Category: {item.category}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                    +{item.pointsAwarded || 35} pts
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claim Modal Confirmation */}
      {claimingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Free Academic Claim</span>
                <h3 className="text-base font-black text-white mt-0.5">{claimingItem.title}</h3>
              </div>
              <button onClick={() => setClaimingItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
              <div>📦 <strong>Donor:</strong> {claimingItem.donorName} ({claimingItem.donorUSN})</div>
              <div>✨ <strong>Condition:</strong> {claimingItem.condition}</div>
              <div>📍 <strong>Pickup Spot:</strong> ECE Lab 104 / Student Council Help Desk</div>
            </div>

            <p className="text-xs text-slate-400">
              This item will be reserved under your USN (<strong>{currentUser?.usn || 'Your Account'}</strong>). You can collect it free of cost by presenting your college ID card!
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setClaimingItem(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClaim(claimingItem)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                Confirm Free Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
