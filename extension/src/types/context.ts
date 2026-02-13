export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface Decision {
  title: string;
  detail: string;
  date?: string;
}

export interface ContextData {
  purpose: string;
  assumptions: string[];
  glossary: GlossaryItem[];
  decisions: Decision[];
}
