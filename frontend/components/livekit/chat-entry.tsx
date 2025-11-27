import * as React from 'react';
import { cn } from '@/lib/utils';

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

  return (
    <li
      title={title}
      data-lk-message-origin={messageOrigin}
      className={cn(
        'group flex w-full flex-col gap-1',
        messageOrigin === 'local' ? 'items-end' : 'items-start',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all',
          messageOrigin === 'local'
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted/50 text-foreground rounded-tl-sm border border-white/5'
        )}
      >
        {message}
      </div>

      <div className="flex items-center gap-2 px-1">
        {name && <span className="text-[10px] font-medium text-muted-foreground">{name}</span>}
        <span className="text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
          {hasBeenEdited && <span className="mr-1 italic">edited</span>}
          {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
        </span>
      </div>
    </li>
  );
};
