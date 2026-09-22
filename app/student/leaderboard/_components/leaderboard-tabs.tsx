'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Rocket, Star, Zap, Users, Orbit, Sparkles, type LucideIcon } from 'lucide-react'
import type { LeaderboardEntry, Tier } from '@/lib/leaderboard'

const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Sector Bronce',
  silver: 'Sector Plata',
  gold: 'Sector Oro',
}

const TIER_COLOR: Record<Tier, string> = {
  bronze: 'text-amber-700 bg-amber-50',
  silver: 'text-slate-500 bg-slate-100',
  gold: 'text-yellow-600 bg-yellow-50',
}

const RANK_COLOR: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-slate-400',
  3: 'text-amber-700',
}

export interface LeaderboardTabsProps {
  classroomEntries: LeaderboardEntry[]
  ownTier: Tier
  ownTierLeaderboard: { top: LeaderboardEntry[]; ownEntry: LeaderboardEntry | null }
  institution: Record<Tier, { top: LeaderboardEntry[]; ownEntry: LeaderboardEntry | null }>
}

type TabKey = 'classroom' | 'tier' | 'institution'

export function LeaderboardTabs({
  classroomEntries,
  ownTier,
  ownTierLeaderboard,
  institution,
}: LeaderboardTabsProps) {
  const [tab, setTab] = useState<TabKey>('classroom')

  const tabs: { key: TabKey; label: string; Icon: LucideIcon }[] = [
    { key: 'classroom', label: 'Mi tripulación', Icon: Users },
    { key: 'tier', label: 'Mi sector', Icon: Orbit },
    { key: 'institution', label: 'La galaxia', Icon: Sparkles },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-white border border-indigo-100 rounded-full p-1 w-fit mx-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-indigo-600 text-white'
                : 'text-indigo-400 hover:text-indigo-600',
            )}
          >
            <t.Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'classroom' && (
        <LeaderboardList
          entries={classroomEntries}
          emptyMessage="Todavía no hay energía estelar registrada en tu tripulación."
        />
      )}

      {tab === 'tier' && (
        <div className="space-y-3">
          <TierHeading tier={ownTier} />
          <LeaderboardList
            entries={ownTierLeaderboard.top}
            ownEntry={ownTierLeaderboard.ownEntry}
            emptyMessage="Todavía no hay energía estelar registrada en tu sector."
          />
        </div>
      )}

      {tab === 'institution' && (
        <div className="space-y-6">
          {(['gold', 'silver', 'bronze'] as Tier[]).map((tier) => (
            <div key={tier} className="space-y-3">
              <TierHeading tier={tier} />
              <LeaderboardList
                entries={institution[tier].top}
                ownEntry={tier === ownTier ? institution[tier].ownEntry : null}
                emptyMessage="Todavía no hay energía estelar registrada en este sector."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TierHeading({ tier }: { tier: Tier }) {
  return (
    <p
      className={cn(
        'text-sm font-semibold flex items-center gap-1.5 w-fit px-3 py-1 rounded-full',
        TIER_COLOR[tier],
      )}
    >
      <Orbit className="w-3.5 h-3.5" />
      {TIER_LABEL[tier]}
    </p>
  )
}

function LeaderboardList({
  entries,
  ownEntry,
  emptyMessage,
}: {
  entries: LeaderboardEntry[]
  ownEntry?: LeaderboardEntry | null
  emptyMessage: string
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-indigo-300 py-6 text-center">{emptyMessage}</p>
  }

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 divide-y divide-indigo-50 overflow-hidden">
      {entries.map((entry) => (
        <LeaderboardRow key={entry.id} entry={entry} />
      ))}
      {ownEntry && (
        <>
          <div className="px-4 py-1.5 text-center text-xs text-indigo-300 bg-indigo-50/50">
            ···
          </div>
          <LeaderboardRow entry={ownEntry} />
        </>
      )}
    </div>
  )
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        entry.isCurrentUser && 'bg-indigo-50',
      )}
    >
      <span
        className={cn(
          'w-6 flex items-center justify-center flex-shrink-0',
          RANK_COLOR[entry.position] ?? 'text-indigo-300',
        )}
      >
        {entry.position <= 3 ? (
          <Rocket className="w-4 h-4" fill="currentColor" />
        ) : (
          <span className="text-sm font-semibold">{entry.position}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium truncate',
            entry.isCurrentUser ? 'text-indigo-700' : 'text-indigo-950',
          )}
        >
          {entry.name}
          {entry.isCurrentUser && ' (tú)'}
        </p>
      </div>
      {entry.isGraduated && (
        <Badge variant="secondary" className="text-xs flex-shrink-0 rounded-full">
          Egresado
        </Badge>
      )}
      <span className="flex items-center gap-1 text-xs text-indigo-400 flex-shrink-0">
        <Star className="w-3 h-3" />
        Nivel {entry.level}
      </span>
      <span className="flex items-center gap-1 text-sm font-semibold text-orange-600 flex-shrink-0 w-20 justify-end">
        <Zap className="w-3.5 h-3.5" fill="currentColor" />
        {entry.totalXp.toLocaleString('es-AR')}
      </span>
    </div>
  )
}
