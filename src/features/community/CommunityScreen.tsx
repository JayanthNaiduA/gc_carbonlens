import React, { useState } from 'react';
import { GreenCard, ChoiceTabs } from '../../components/common/CommonWidgets';
import { Trophy, User, Shield } from 'lucide-react';
import { COMMUNITY_MEMBERS } from '../../data/mockData';

export const CommunityScreen: React.FC = () => {
  const [scope, setScope] = useState(0); // 0: Global, 1: Friends, 2: Local

  return (
    <div className="space-y-4">
      <ChoiceTabs
        labels={['Global', 'Friends', 'Local']}
        selected={scope}
        onChanged={setScope}
      />

      {scope === 0 ? (
        <div className="space-y-2.5 pt-2">
          {COMMUNITY_MEMBERS.map((member, idx) => {
            const isYou = member.name.includes('John') || member.name.includes('You');
            return (
              <GreenCard
                key={member.name}
                bgColor={isYou ? 'bg-[#fff7d9] border-[#ffe899]' : 'bg-white'}
                padding="p-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-7 text-center font-extrabold text-sm text-[#008b5b]">
                      {idx === 0 ? (
                        <Trophy size={18} className="text-[#d2aa00] mx-auto" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="w-9 h-9 rounded-full bg-[#e4f7eb] flex items-center justify-center text-[#008b5b] shrink-0 font-bold text-xs">
                      {isYou ? 'JD' : member.name.slice(-1)}
                    </div>

                    <span
                      className={`text-sm ${
                        isYou ? 'font-bold text-[#10243b]' : 'font-medium text-[#404c5e]'
                      }`}
                    >
                      {member.name}
                    </span>
                  </div>

                  <span className="text-sm font-bold text-[#10243b]">
                    {member.points.toLocaleString()} GP
                  </span>
                </div>
              </GreenCard>
            );
          })}
        </div>
      ) : (
        <GreenCard padding="p-6">
          <div className="text-center space-y-2">
            <Shield size={32} className="mx-auto text-[#008b5b]" />
            <h4 className="text-base font-bold text-[#10243b]">Private Community Circle</h4>
            <p className="text-xs sm:text-sm text-[#53667b] max-w-sm mx-auto">
              No opt-in {scope === 1 ? 'friends' : 'local neighbourhood'} leaderboard is connected. Your profile and precise location remain private.
            </p>
          </div>
        </GreenCard>
      )}

      <p className="text-[11px] text-[#53667b] leading-tight pt-1">
        Demo ranking · simulated members and balances. Real community participation will require explicit opt-in.
      </p>
    </div>
  );
};
