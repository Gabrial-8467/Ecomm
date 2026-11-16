export interface ParsedOrderNotes {
  fulfillment: string | null;
  preferredSlot: string | null;
  freeAssembly: boolean;
  instructions: string | null;
  returnReason: string | null;
  other: string[];
}

/**
 * Parses composite order customer notes (e.g., fulfillment type, delivery slot,
 * free assembly request, custom instructions, and return/replacement reason)
 * that may have been joined with " | " or newlines, returning a clean structured object.
 */
export function parseOrderNotes(
  rawNote?: string | null,
  cancelReason?: string | null
): ParsedOrderNotes {
  const result: ParsedOrderNotes = {
    fulfillment: null,
    preferredSlot: null,
    freeAssembly: false,
    instructions: null,
    returnReason: cancelReason?.trim() || null,
    other: [],
  };

  if (!rawNote || !rawNote.trim()) {
    return result;
  }

  // Split by " | " or newlines
  const parts = rawNote
    .split(/\s*\|\s*|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (/^Fulfillment:\s*/i.test(part)) {
      result.fulfillment = part.replace(/^Fulfillment:\s*/i, '').trim();
    } else if (/^Preferred Slot:\s*/i.test(part)) {
      result.preferredSlot = part.replace(/^Preferred Slot:\s*/i, '').trim();
    } else if (/^Free Assembly:\s*(YES|NO)/i.test(part)) {
      result.freeAssembly = /^Free Assembly:\s*YES/i.test(part);
    } else if (/^\[?(?:Return\/Replacement|Return|Replacement)\s*Requested:\s*/i.test(part)) {
      const cleaned = part
        .replace(/^\[?(?:Return\/Replacement|Return|Replacement)\s*Requested:\s*/i, '')
        .replace(/\]$/, '')
        .trim();
      if (cleaned) {
        result.returnReason = cleaned;
      }
    } else if (/^(?:Return\s+)?Reason:\s*/i.test(part)) {
      const cleaned = part.replace(/^(?:Return\s+)?Reason:\s*/i, '').trim();
      if (cleaned) {
        result.returnReason = cleaned;
      }
    } else if (/^Instructions:\s*/i.test(part)) {
      result.instructions = part.replace(/^Instructions:\s*/i, '').trim();
    } else {
      if (!result.instructions) {
        result.instructions = part;
      } else {
        result.other.push(part);
      }
    }
  }

  return result;
}
