import { scrapeSources } from '../services/scrapeSources';
import { getCronSources } from '../services/getCronSources';
import { generateNewsletter } from '../services/generateNewsletter'
import { sendNewsletter } from '../services/sendNewsletter'
import fs from 'fs';
export const handleCron = async (): Promise<void> => {
  try {
   
    const cronSources = await getCronSources();
    const rawStories = await scrapeSources(cronSources);
    //const rawStories = fs.readFileSync('./combinedText.json', 'utf8').toString();
    const rawStoriesString = JSON.stringify(rawStories);
    const newsletter = await generateNewsletter(rawStoriesString);
    const result = await sendNewsletter(newsletter!, rawStoriesString);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}