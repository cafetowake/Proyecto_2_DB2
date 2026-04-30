// Admin controller - handles bulk operations, CSV upload, seeding
import * as adminService from '../services/adminService.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

// POST /seed - Trigger full data seeder
export async function seedDatabase(req, res, next) {
  try {
    console.log('Starting database seeding...');
    const summary = await adminService.seedDatabase();
    
    res.json({
      message: 'Database seeded successfully',
      summary
    });
  } catch (error) {
    next(error);
  }
}

// POST /csv - Upload CSV and load into Neo4j
export async function uploadCSV(req, res, next) {
  try {
    const type = req.body.type ?? req.query.type; // sent as FormData field or query param
    const file = req.file; // set by multer middleware
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse CSV from buffer
    const records = [];
    const stream = Readable.from(file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => records.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    let result;
    switch (type) {
      case 'users':
        result = await adminService.loadUsersFromCSV(records);
        break;
      case 'posts':
        result = await adminService.loadPostsFromCSV(records);
        break;
      case 'groups':
        result = await adminService.loadGroupsFromCSV(records);
        break;
      case 'topics':
        result = await adminService.loadTopicsFromCSV(records);
        break;
      case 'hashtags':
        result = await adminService.loadHashtagsFromCSV(records);
        break;
      case 'follows':
        result = await adminService.loadFollowsFromCSV(records);
        break;
      case 'likes':
        result = await adminService.loadLikesFromCSV(records);
        break;
      case 'members':
        result = await adminService.loadMembersFromCSV(records);
        break;
      case 'follows_hashtag':
        result = await adminService.loadFollowsHashtagFromCSV(records);
        break;
      case 'tag_in_topic':
        result = await adminService.loadTaggedWithFromCSV(records);
        break;
      default:
        return res.status(400).json({ error: 'Invalid CSV type' });
    }

    res.json({
      message: `Loaded ${type} from CSV`,
      result
    });
  } catch (error) {
    next(error);
  }
}
