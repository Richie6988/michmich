'use client';

import React from 'react';

export interface FilterChipOption {
  id: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'single' | 'multi';
  options: FilterChipOption[];
}

interface FiltersBarProps {
  filterGroups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onChange: (newFilters: Record<string, string[]>) => void;
  /** Optional title shown above the chips */
  title?: string;
}

export function FiltersBar({ filterGroups, selectedFilters, onChange, title }: FiltersBarProps) {
  const toggle = (groupId: string, optionId: string, type: 'single' | 'multi') => {
    const current = selectedFilters[groupId] || [];
    let next: string[];
    if (type === 'single') {
      next = current.includes(optionId) ? [] : [optionId];
    } else {
      next = current.includes(optionId)
        ? current.filter(x => x !== optionId)
        : [...current, optionId];
    }
    onChange({ ...selectedFilters, [groupId]: next });
  };

  const totalSelected = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2.5 mb-2">
      {title && (
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{title}</p>
          {totalSelected > 0 && (
            <button
              onClick={() => onChange({})}
              className="text-[10px] text-rose-600 font-semibold hover:underline"
            >
              Clear ({totalSelected})
            </button>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        {filterGroups.map(group => (
          <div key={group.id}>
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1">
              {group.options.map(opt => {
                const active = (selectedFilters[group.id] || []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggle(group.id, opt.id, group.type)}
                    className={`text-[11px] font-medium rounded-full px-2.5 py-1 transition-all border ${
                      active
                        ? 'bg-barry-blue text-white border-barry-blue'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Pre-defined filter groups for each section
// ============================================================

export const HOTEL_FILTERS: FilterGroup[] = [
  {
    id: 'rooms',
    label: 'Rooms needed',
    type: 'single',
    options: [
      { id: '1', label: '1 room' },
      { id: '2', label: '2 rooms' },
      { id: '3', label: '3+ rooms' },
    ],
  },
  {
    id: 'amenities',
    label: 'Must-have',
    type: 'multi',
    options: [
      { id: 'pool', label: 'Pool' },
      { id: 'wifi', label: 'WiFi' },
      { id: 'breakfast', label: 'Breakfast' },
      { id: 'parking', label: 'Parking' },
      { id: 'gym', label: 'Gym' },
      { id: 'pet', label: 'Pet-friendly' },
      { id: 'kids', label: 'Kids-friendly' },
    ],
  },
  {
    id: 'budget',
    label: 'Budget per night',
    type: 'single',
    options: [
      { id: 'low', label: 'Up to 100 EUR' },
      { id: 'mid', label: '100-200 EUR' },
      { id: 'high', label: '200+ EUR' },
    ],
  },
];

export const VENUE_FILTERS: FilterGroup[] = [
  {
    id: 'cuisine',
    label: 'Type of food',
    type: 'multi',
    options: [
      { id: 'french', label: 'French' },
      { id: 'italian', label: 'Italian' },
      { id: 'asian', label: 'Asian' },
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'vegan', label: 'Vegan' },
      { id: 'gluten-free', label: 'Gluten-free' },
      { id: 'tapas', label: 'Tapas' },
      { id: 'seafood', label: 'Seafood' },
    ],
  },
  {
    id: 'vibe',
    label: 'Atmosphere',
    type: 'multi',
    options: [
      { id: 'quiet', label: 'Quiet' },
      { id: 'lively', label: 'Lively' },
      { id: 'romantic', label: 'Romantic' },
      { id: 'family', label: 'Kids-friendly' },
      { id: 'terrace', label: 'Terrace' },
      { id: 'rooftop', label: 'Rooftop' },
    ],
  },
  {
    id: 'budget',
    label: 'Budget per person',
    type: 'single',
    options: [
      { id: 'low', label: 'Up to 25 EUR' },
      { id: 'mid', label: '25-50 EUR' },
      { id: 'high', label: '50+ EUR' },
    ],
  },
];

export const ACTIVITY_FILTERS: FilterGroup[] = [
  {
    id: 'category',
    label: 'Type',
    type: 'multi',
    options: [
      { id: 'cultural', label: 'Cultural' },
      { id: 'outdoor', label: 'Outdoor' },
      { id: 'food', label: 'Food' },
      { id: 'wellness', label: 'Wellness' },
      { id: 'nightlife', label: 'Nightlife' },
      { id: 'sports', label: 'Sports' },
    ],
  },
  {
    id: 'duration',
    label: 'Duration',
    type: 'single',
    options: [
      { id: 'short', label: 'Up to 2h' },
      { id: 'half', label: 'Half day' },
      { id: 'full', label: 'Full day' },
    ],
  },
  {
    id: 'kids',
    label: 'Audience',
    type: 'multi',
    options: [
      { id: 'kids-friendly', label: 'Kids-friendly' },
      { id: 'adults-only', label: 'Adults only' },
    ],
  },
];

export const CAR_FILTERS: FilterGroup[] = [
  {
    id: 'category',
    label: 'Type',
    type: 'multi',
    options: [
      { id: 'compact', label: 'Compact' },
      { id: 'midsize', label: 'Midsize' },
      { id: 'suv', label: 'SUV' },
      { id: 'van', label: 'Van' },
      { id: 'electric', label: 'Electric' },
    ],
  },
  {
    id: 'transmission',
    label: 'Transmission',
    type: 'single',
    options: [
      { id: 'manual', label: 'Manual' },
      { id: 'automatic', label: 'Automatic' },
    ],
  },
  {
    id: 'seats',
    label: 'Seats needed',
    type: 'single',
    options: [
      { id: '4', label: '4+' },
      { id: '5', label: '5+' },
      { id: '7', label: '7+' },
    ],
  },
];
