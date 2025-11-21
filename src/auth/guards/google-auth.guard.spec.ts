import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;

  beforeEach(() => {
    guard = new GoogleAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should be an instance of GoogleAuthGuard', () => {
    expect(guard).toBeInstanceOf(GoogleAuthGuard);
  });

  it('should have correct constructor', () => {
    expect(GoogleAuthGuard.name).toBe('GoogleAuthGuard');
  });
});
