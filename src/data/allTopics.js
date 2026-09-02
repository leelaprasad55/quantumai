// Merge all topic data
import { TOPICS } from './topics.js';
import { TOPICS_B } from './topics2.js';
import { TOPICS_C } from './topics3.js';
import { TOPICS_D } from './topics4.js';

export const ALL_TOPICS = { ...TOPICS, ...TOPICS_B, ...TOPICS_C, ...TOPICS_D };
export { TOPICS, TOPICS_B, TOPICS_C, TOPICS_D };
