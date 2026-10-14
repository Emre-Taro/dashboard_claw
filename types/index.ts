// types/index.ts

export interface GoalItem {
    id: string;
    text: string;
    completed: boolean;
  }
  
  export interface GoalsData {
    longTerm: GoalItem[];
    weekly: GoalItem[];
    daily: GoalItem[];
  }
  
  export interface KnowledgeItem {
    id: string;
    title: string;
    url: string;
    category: 'AI/ML/Data' | 'Finance' | 'Business' | 'Art/Design' | 'Trivia';
    summary: string;
  }
  
  export type JobEmailStatus = 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected' | 'other';

  export interface EmailItem {
    id: string;
    sender: string;
    subject: string;
    snippet: string;
    date: string;
    status: JobEmailStatus;
    url?: string;
  }