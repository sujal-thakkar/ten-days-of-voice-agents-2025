import * as React from 'react';
import { cn } from '@/lib/utils';

// D20 Icon for Game Master messages
function D20Icon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2L21 8V16L12 22L3 16V8L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 2V22M3 8L21 16M21 8L3 16"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

// Sword Icon for Player messages
function SwordIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M14.5 17.5L3 6V3H6L17.5 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 19L19 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M19 3L21 5L18 8L16 6L19 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The locale to use for the timestamp. */
  locale: string;
  /** The timestamp of the message. */
  timestamp: number;
  /** The message to display. */
  message: string;
  /** The origin of the message. */
  messageOrigin: 'local' | 'remote';
  /** The sender's name. */
  name?: string;
  /** Whether the message has been edited. */
  hasBeenEdited?: boolean;
}

export const ChatEntry = ({
  name,
  locale,
  timestamp,
  message,
  messageOrigin,
  hasBeenEdited = false,
  className,
  ...props
}: ChatEntryProps) => {
  const time = new Date(timestamp);
  const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

  const isGameMaster = messageOrigin === 'remote';

  return (
    <li
      title={title}
      data-lk-message-origin={messageOrigin}
      className={cn('group flex w-full flex-col gap-2', className)}
      {...props}
    >
      {/* Game Master Message */}
      {isGameMaster ? (
        <div className="gm-message-box relative px-5 py-4 max-w-[95%] mr-auto">
          {/* Corner decorations */}
          <div className="gm-corner-decoration gm-corner-tl" />
          <div className="gm-corner-decoration gm-corner-tr" />
          <div className="gm-corner-decoration gm-corner-bl" />
          <div className="gm-corner-decoration gm-corner-br" />
          
          {/* Header */}
          <header 
            className="flex items-center gap-2 mb-2 pb-2 border-b"
            style={{ borderColor: 'rgba(201, 162, 39, 0.3)' }}
          >
            <D20Icon className="text-amber-400" />
            <span 
              className="text-amber-400 text-sm tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-fantasy)' }}
            >
              Game Master
            </span>
            <span className="ml-auto text-amber-100/50 text-xs opacity-0 transition-opacity group-hover:opacity-100">
              {hasBeenEdited && '*'}
              {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
            </span>
          </header>
          
          {/* Message content */}
          <p 
            className="text-amber-50 leading-relaxed text-base"
            style={{ fontFamily: 'var(--font-narrative)' }}
          >
            {message}
          </p>
        </div>
      ) : (
        /* Player Message */
        <div className="player-message-box relative px-4 py-3 max-w-[85%] ml-auto">
          {/* Header */}
          <header className="flex items-center gap-2 mb-1.5">
            <span className="ml-auto text-sky-100/50 text-xs opacity-0 transition-opacity group-hover:opacity-100">
              {hasBeenEdited && '*'}
              {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
            </span>
            <span 
              className="text-sky-300 text-xs tracking-wide uppercase"
              style={{ fontFamily: 'var(--font-fantasy)' }}
            >
              Adventurer
            </span>
            <SwordIcon className="text-sky-300" />
          </header>
          
          {/* Message content */}
          <p 
            className="text-sky-50 leading-relaxed text-sm italic"
            style={{ fontFamily: 'var(--font-narrative)' }}
          >
            "{message}"
          </p>
        </div>
      )}
    </li>
  );
};
