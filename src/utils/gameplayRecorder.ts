import { callScreenRecorder } from './callScreenRecorder';

export interface GameEvent {
  id: string;
  type: 'call_start' | 'dialogue' | 'charge_attempt' | 'charge_success' | 'soothe' | 'blunder' | 'hangup' | 'app_used';
  timestamp: number;
  timeString: string;
  callerName?: string;
  archetype?: string;
  details: {
    message?: string;
    reply?: string;
    amount?: number;
    appName?: string;
    suspicion?: number;
    suspicionDelta?: number;
    notes?: string;
  };
}

export interface GameplayClip {
  id: string;
  title: string;
  tag: 'BIG_SCORE' | 'PANIC_SAVE' | 'HILARIOUS' | 'COLD_BLOODED' | 'DISASTER';
  timestamp: string;
  callerName: string;
  callerArchetype: string;
  dialogueSnippet: { speaker: string; text: string; time?: string }[];
  highlightAction: string;
  outcomeText: string;
  earnings: number;
  bossReactionHint: 'laugh' | 'mad' | 'proud' | 'facepalm';
  videoUrl?: string;
  scannedWords?: string[];
  recordingSource?: 'screen_capture' | 'workspace_capture';
  durationSeconds?: number;
}

class GameplayRecorder {
  private events: GameEvent[] = [];
  private shiftStartTime: number = Date.now();

  resetForNewShift() {
    this.events = [];
    this.shiftStartTime = Date.now();
    callScreenRecorder.resetShift();
  }

  recordEvent(
    type: GameEvent['type'],
    details: GameEvent['details'],
    callerName?: string,
    archetype?: string
  ) {
    const now = Date.now();
    const event: GameEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      type,
      timestamp: now,
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      callerName,
      archetype,
      details,
    };
    this.events.push(event);

    // Also feed dialogue to callScreenRecorder
    if (callerName) {
      if (type === 'dialogue') {
        if (details.message) {
          callScreenRecorder.scanSpokenDialogue('Operator', details.message, 'Operator Line');
        }
        if (details.reply) {
          callScreenRecorder.scanSpokenDialogue(callerName, details.reply, 'Target Voice');
        }
      } else if (type === 'charge_success') {
        callScreenRecorder.scanSpokenDialogue('System', `Payment Cleared: $${details.amount?.toLocaleString()} via ${details.appName || 'Terminal'}`, 'CLEARED');
      } else if (type === 'blunder') {
        callScreenRecorder.scanSpokenDialogue('System', `Suspicion Spiked to ${details.suspicion}%: ${details.notes || 'Alert'}`, 'SUSPICION');
      }
    }
  }

  getEvents(): GameEvent[] {
    return [...this.events];
  }

  // Generate surveillance clips STRICTLY for callers who were actually called and interacted with during this shift
  // If the user only called 2 people, return EXACTLY 2 tapes. No fake or fabricated tapes!
  generateShiftClips(shiftDay: number): GameplayClip[] {
    const clips: GameplayClip[] = [];

    // Extract all unique callers that the player actually interacted with during this shift
    const callersCalled = Array.from(
      new Set(
        this.events
          .filter((e) => e.callerName && e.callerName.trim().length > 0)
          .map((e) => e.callerName!.trim())
      )
    ).filter((callerName) => {
      // Must have actual interaction: dialogue, charge, app usage, or blunder/soothe!
      // Do NOT create a tape if a caller was just loaded or skipped without speaking!
      const callerEvts = this.events.filter((e) => e.callerName === callerName);
      return callerEvts.some(
        (e) =>
          e.type === 'dialogue' ||
          e.type === 'charge_success' ||
          e.type === 'charge_attempt' ||
          e.type === 'app_used' ||
          e.type === 'soothe' ||
          (e.type === 'blunder' && e.details.suspicion && e.details.suspicion > 30)
      );
    });

    // If no one was called yet in this shift, return empty array (NO FAKE TAPES)
    if (callersCalled.length === 0) {
      return [];
    }

    let clipIdx = 1;

    for (const callerName of callersCalled) {
      const callerEvents = this.events.filter((e) => e.callerName === callerName);
      const archetype = callerEvents.find((e) => e.archetype)?.archetype || 'Citizen';

      // Pull real screen recording from callScreenRecorder if available
      const recording = callScreenRecorder.getRecordingForCaller(callerName);

      // Find key milestone events for this caller
      const successEvt = callerEvents.find((e) => e.type === 'charge_success');
      const blunderEvt = callerEvents.find(
        (e) => e.type === 'blunder' || (e.details.suspicion && e.details.suspicion >= 70)
      );
      const sootheEvt = callerEvents.find((e) => e.type === 'soothe');
      const hangupEvt = callerEvents.find((e) => e.type === 'hangup');
      const dialogEvts = callerEvents.filter((e) => e.type === 'dialogue');

      // Build real dialogue snippet from actual recorded chat history
      const snippet: { speaker: string; text: string; time?: string }[] = [];

      if (recording && recording.transcript.length > 0) {
        // Use the exact scanned dialogue from the video recording!
        recording.transcript.slice(-4).forEach((item) => {
          snippet.push({
            speaker: item.speaker,
            text: item.text,
            time: item.timeString,
          });
        });
      } else if (dialogEvts.length > 0) {
        // Take up to 2 dialogue pairs from this caller
        const recentDialogs = dialogEvts.slice(-2);
        recentDialogs.forEach((d) => {
          if (d.details.message) {
            snippet.push({ speaker: 'Operator', text: d.details.message, time: d.timeString });
          }
          if (d.details.reply) {
            snippet.push({ speaker: callerName, text: d.details.reply, time: d.timeString });
          }
        });
      } else {
        snippet.push({
          speaker: callerName,
          text: 'Hello? Yes, I am on the line. What is this concerning?',
          time: '00:02',
        });
      }

      // Determine clip characteristics based on actual interaction
      let tag: GameplayClip['tag'] = 'COLD_BLOODED';
      let title = `TAPE #${clipIdx}: ${callerName}`;
      let highlightAction = 'Caller engaged on support queue';
      let outcomeText = 'Session recorded on floor archive.';
      let earnings = 0;
      let bossReactionHint: GameplayClip['bossReactionHint'] = 'proud';

      if (successEvt) {
        tag = 'BIG_SCORE';
        earnings = successEvt.details.amount || 0;
        title = `TAPE #${clipIdx}: ${callerName} - $${earnings.toLocaleString()} Cleared`;
        highlightAction = `Processed $${earnings.toLocaleString()} via ${successEvt.details.appName || 'Terminal'}`;
        outcomeText = `Funds successfully extracted from ${callerName}. Completely drained!`;
        bossReactionHint = 'laugh';
      } else if (blunderEvt) {
        tag = 'DISASTER';
        title = `TAPE #${clipIdx}: ${callerName} - Suspicion Blowout`;
        highlightAction = `Target suspicion spiked to ${blunderEvt.details.suspicion || 85}%`;
        outcomeText = `Caller grew suspicious and disconnected before transaction.`;
        bossReactionHint = 'mad';
      } else if (sootheEvt) {
        tag = 'HILARIOUS';
        title = `TAPE #${clipIdx}: ${callerName} - Manipulation`;
        highlightAction = `Target suspicion successfully calmed down`;
        outcomeText = `Operator de-escalated target using script protocols.`;
        bossReactionHint = 'laugh';
      } else if (hangupEvt) {
        tag = 'DISASTER';
        title = `TAPE #${clipIdx}: ${callerName} - Terminated Call`;
        highlightAction = `Call was disconnected prematurely`;
        outcomeText = `No revenue was recovered from this lead.`;
        bossReactionHint = 'facepalm';
      }

      clips.push({
        id: `clip_real_${clipIdx}`,
        title,
        tag,
        timestamp: callerEvents[0]?.timeString || '11:30 AM',
        callerName,
        callerArchetype: archetype,
        dialogueSnippet: snippet,
        highlightAction,
        outcomeText,
        earnings,
        bossReactionHint,
        videoUrl: recording?.videoUrl,
        scannedWords: recording?.scannedKeywords,
        recordingSource: recording?.recordingSource || 'workspace_capture',
        durationSeconds: recording?.durationSeconds || 12,
      });

      clipIdx++;
    }

    return clips;
  }
}

export const gameplayRecorder = new GameplayRecorder();
