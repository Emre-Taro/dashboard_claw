// types/index.ts

export interface GoalItem {
    id: string;
    text: string;
    completed: boolean;
  }
  
  export interface GoalsData {
    longTerm: string[];
    monthly: GoalItem[];
    weekly: GoalItem[];
  }
  
  export interface KnowledgeItem {
    id: string;
    title: string;
    url: string;
    category: 'AI/ML/Data' | 'Finance' | 'Business' | 'Art/Design' | 'Trivia';
    summary: string;
  }
  
  export interface EmailItem {
    id: string;
    sender: string;
    subject: string;
    snippet: string;
    date: string;
  }