'use client';

import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { cn } from '@/lib/utils';
import { AppConfig } from '@/app-config';
import { 
  Microphone, 
  VideoCamera, 
  Desktop, 
  ChatCircle, 
  Books, 
  CaretLeft, 
  CaretRight, 
  CheckCircle, 
  Circle,
  ListChecks,
  Student
} from '@phosphor-icons/react/dist/ssr';

interface SidebarProps {
  appConfig: AppConfig;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ appConfig, collapsed, onToggleCollapse }: SidebarProps) {
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const { modules, percentComplete, toggleComplete } = useModuleProgress();

  const modeItems = [
    {
      label: 'Voice',
      enabled: isMicrophoneEnabled,
      icon: Microphone,
    },
    {
      label: 'Video',
      enabled: isCameraEnabled,
      icon: VideoCamera,
    },
    {
      label: 'Screen',
      enabled: isScreenShareEnabled,
      icon: Desktop,
    },
    {
      label: 'Chat',
      enabled: appConfig.supportsChatInput,
      icon: ChatCircle,
    },
  ];

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 z-50 border-r border-white/10 bg-[#05070B] flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16 px-2 py-4' : 'w-72 px-4 py-6'
      )}
    >
      {/* Branding */}
      <div className={cn('flex items-center mb-8', collapsed ? 'justify-center' : 'gap-3 px-2')}>
        <div className="relative flex items-center justify-center h-10 w-10 rounded-lg bg-[#0056D2] text-white shadow-lg shadow-blue-900/20">
          <Student weight="fill" className="h-6 w-6" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white">
              Coursera
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#00A5E8] font-semibold">
              Learning Coach
            </span>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          'absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#1F1F1F] text-white hover:bg-[#0056D2] transition-colors shadow-md z-50',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <CaretRight size={12} weight="bold" /> : <CaretLeft size={12} weight="bold" />}
      </button>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto space-y-8 scrollbar-hide">
        
        {/* Modes */}
        <div className="space-y-3">
          {!collapsed && (
            <h2 className="px-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
              Active Modes
            </h2>
          )}
          <ul className="space-y-1">
            {modeItems.map((m) => (
              <li
                key={m.label}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                  m.enabled
                    ? 'bg-[#0056D2]/10 text-[#00A5E8] border border-[#0056D2]/20'
                    : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300 border border-transparent',
                  collapsed && 'justify-center px-0'
                )}
                title={m.label}
              >
                <m.icon size={18} weight={m.enabled ? "fill" : "regular"} />
                {!collapsed && <span className="font-medium">{m.label}</span>}
                {!collapsed && m.enabled && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00A5E8] shadow-[0_0_8px_rgba(0,165,232,0.6)]" />
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          {!collapsed && (
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Course Progress
              </h2>
              <span className="text-xs font-mono text-[#00A5E8]">{percentComplete}%</span>
            </div>
          )}
          
          <div className={cn("relative px-2", collapsed && "px-1")}>
             <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div 
                  className="h-full bg-[#0056D2] transition-all duration-500 ease-out"
                  style={{ width: `${percentComplete}%` }}
                />
             </div>
          </div>

          {!collapsed && (
            <ul className="space-y-1 mt-2">
              {modules.map((mod) => (
                <li key={mod.id}>
                  <button
                    onClick={() => toggleComplete(mod.id)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 text-left',
                      mod.completed
                        ? 'text-neutral-300 hover:bg-white/5'
                        : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                    )}
                  >
                    {mod.completed ? (
                      <CheckCircle size={16} weight="fill" className="text-green-500 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-neutral-600 group-hover:text-neutral-400 shrink-0" />
                    )}
                    <span className={cn("truncate", mod.completed && "line-through opacity-50")}>
                      {mod.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {collapsed && (
             <div className="flex justify-center mt-4">
                <ListChecks size={20} className="text-neutral-500" />
             </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="mt-auto pt-6 border-t border-white/5 px-2">
          <div className="rounded-lg bg-[#0056D2]/10 p-3 border border-[#0056D2]/20">
            <p className="text-[10px] leading-relaxed text-[#00A5E8]/80 font-medium">
              "Consistency is key. Complete one module at a time."
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
