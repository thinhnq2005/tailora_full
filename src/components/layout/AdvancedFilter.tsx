'use client';

import React, { useState, useEffect } from 'react';

interface FilterGroupData {
  id: string;
  name: string;
  values: string[];
}

export default function AdvancedFilter(): React.JSX.Element {
  const [filterGroups, setFilterGroups] = useState<FilterGroupData[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    let active = true;
    async function fetchFilters() {
      try {
        const res = await fetch('/api/products/filters');
        if (!res.ok) {
          if (active) {
            setFilterGroups([
              { id: 'brand', name: 'Thương Hiệu', values: ['Hòa Phát', 'Miền Nam', 'Việt Mỹ', 'Insee', 'Tây Đô'] },
              { id: 'spec', name: 'Kích Thước / Quy Cách', values: ['phi 6', 'phi 8', 'phi 10', 'phi 12', 'Mác PCB40'] }
            ]);
          }
          return;
        }
        const data = await res.json();
        if (active && Array.isArray(data)) setFilterGroups(data);
      } catch {
        if (active) setStatus('Hệ thống đang đồng bộ bộ lọc bến bãi...');
      }
    }
    fetchFilters();
    return () => { active = false; };
  }, []);

  const handleSelectFilter = (groupId: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [groupId]: prev[groupId] === value ? '' : value
    }));
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 space-y-5 shadow-sm select-none">
      <div className="border-b border-gray-100 pb-2">
        <h3 className="text-black text-xs font-black uppercase tracking-widest font-mono">Bộ lọc nâng cao</h3>
      </div>

      {status && (
        <div className="text-[10px] font-mono text-black bg-gray-50 px-2 py-1 rounded">
          {status}
        </div>
      )}

      <div className="space-y-4">
        {filterGroups.map(group => (
          <div key={group.id} className="space-y-1.5">
            <div className="text-[10px] uppercase font-black tracking-wider text-gray-500">{group.name}</div>
            <div className="flex flex-wrap gap-1">
              {group.values.map(val => {
                const isSelected = selectedFilters[group.id] === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectFilter(group.id, val)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <div className="text-[10px] uppercase font-black tracking-wider text-gray-500">Khoảng Giá (VND)</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Từ"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-black font-mono placeholder-gray-400 outline-none focus:border-black"
            />
            <input
              type="number"
              placeholder="Đến"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-black font-mono placeholder-gray-400 outline-none focus:border-black"
            />
          </div>
        </div>
      </div>
    </div>
  );
}