/* eslint-disable no-console */
import { env } from '~/config/env';

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARNING = 3,
  ERROR = 4,
  FATAL = 5,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARNING]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

type LogMessage = string | number | boolean | object | Error | null | undefined;

const safeSerialize = (value: unknown): string => {
  try {
    const json = JSON.stringify(value);
    return typeof json === 'undefined' ? String(value) : json;
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }
};

const processLog = (message: LogMessage): string => {
  if (message instanceof Error) {
    return message.message;
  }
  return safeSerialize(message);
};

const preProcessLog = (level: LogLevel, message: LogMessage): string => {
  const timestamp = `[${new Date().toISOString()}]`;
  const levelName = LOG_LEVEL_NAMES[level] || '';
  const preText = levelName.substring(0, 4);
  const messageToDisplay = processLog(message);
  return `${timestamp} ${preText}: ${messageToDisplay}`;
};

const log = (level: LogLevel = LogLevel.INFO, ...messages: LogMessage[]): void => {
  if (level === LogLevel.TRACE && env.NODE_ENV !== 'development') {
    return;
  }

  let messageToDisplay = '';

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (i === 0) {
      messageToDisplay = preProcessLog(level, message);
    } else {
      messageToDisplay = messageToDisplay.concat(' => ', processLog(message));
    }
    if (message instanceof Error) {
      console.error(`${message.stack}`);
    }
  }

  const levelToConsole: Record<LogLevel, (...args: unknown[]) => void> = {
    [LogLevel.TRACE]: console.log,
    [LogLevel.DEBUG]: console.log,
    [LogLevel.INFO]: console.info,
    [LogLevel.WARNING]: console.warn,
    [LogLevel.ERROR]: console.error,
    [LogLevel.FATAL]: console.error,
  };

  const writer = levelToConsole[level] ?? console.log;
  writer(messageToDisplay);
};

export const logTrace = (...messages: LogMessage[]): void => log(LogLevel.TRACE, ...messages);
export const logDebug = (...messages: LogMessage[]): void => log(LogLevel.DEBUG, ...messages);
export const logInfo = (...messages: LogMessage[]): void => log(LogLevel.INFO, ...messages);
export const logWarning = (...messages: LogMessage[]): void => log(LogLevel.WARNING, ...messages);
export const logError = (...messages: LogMessage[]): void => log(LogLevel.ERROR, ...messages);
export const logFatal = (...messages: LogMessage[]): void => log(LogLevel.FATAL, ...messages);

