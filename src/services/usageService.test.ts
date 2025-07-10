import { getUserUsage } from './usageService';
import { doc, getDoc } from 'firebase/firestore';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn()
}));

describe('Usage Service', () => {
  it('gets user usage statistics', async () => {
    (doc as jest.Mock).mockReturnValue('docRef');
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => ({ totalAnalyses: 5 }) });

    const result = await getUserUsage('user1');
    expect(result).toEqual({ totalAnalyses: 5 });
    expect(doc).toHaveBeenCalledWith({}, 'toolUsage', 'user1');
  });
});
