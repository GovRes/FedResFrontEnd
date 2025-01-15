import { getFileUrl, deleteFile } from '@/app/utils/client-utils';
import { getUrl, remove } from 'aws-amplify/storage';

// Mock aws-amplify/storage
jest.mock('aws-amplify/storage', () => {
  return {
    getUrl: jest.fn(),
    remove: jest.fn()
  };
});

// Mock console.error to avoid polluting test output
const originalError = console.error;
const originalLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});

describe('client utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFileUrl', () => {
    it('returns URL when successful', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test.pdf';
      (getUrl as jest.Mock).mockResolvedValue({ url: mockUrl });

      const result = await getFileUrl({ path: 'test.pdf' });
      expect(result).toBe(mockUrl);
      expect(getUrl).toHaveBeenCalledWith({
        path: 'test.pdf',
        options: {
          bucket: 'govRezUserData'
        }
      });
    });

    it('returns null when error occurs', async () => {
      (getUrl as jest.Mock).mockRejectedValue(new Error('Failed to get URL'));

      const result = await getFileUrl({ path: 'test.pdf' });
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error getting file URL:',
        expect.any(Error)
      );
    });
  });

  describe('deleteFile', () => {
    it('calls remove with correct parameters', async () => {
      await deleteFile({ path: 'test.pdf' });
      expect(remove).toHaveBeenCalledWith({
        path: 'test.pdf'
      });
    });

    it('handles errors gracefully', async () => {
      const error = new Error('Failed to delete');
      (remove as jest.Mock).mockRejectedValue(error);
      
      await deleteFile({ path: 'test.pdf' });
      expect(console.log).toHaveBeenCalledWith('Error ', error);
    });
  });
}); 