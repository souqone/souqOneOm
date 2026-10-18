import { extractCloudinaryPublicId } from './cloudinary-url.util';

describe('extractCloudinaryPublicId', () => {
  it('extracts publicId from standard URL with version and nested folders', () => {
    const url = 'https://res.cloudinary.com/carone/image/upload/v1729000000/carone/listings/car_123.jpg';
    expect(extractCloudinaryPublicId(url)).toBe('carone/listings/car_123');
  });

  it('extracts publicId from URL with transformations and version', () => {
    const url = 'https://res.cloudinary.com/carone/image/upload/c_fill,h_100,w_100/v1612345678/users/avatars/avatar_456.webp';
    expect(extractCloudinaryPublicId(url)).toBe('users/avatars/avatar_456');
  });

  it('extracts publicId from URL with multiple transformation segments and version', () => {
    const url = 'https://res.cloudinary.com/carone/image/upload/c_scale,w_500/q_auto:best/v1/operators/op_789.png';
    expect(extractCloudinaryPublicId(url)).toBe('operators/op_789');
  });

  it('extracts publicId from URL with transformations but NO version', () => {
    const url = 'https://res.cloudinary.com/carone/image/upload/c_fill,h_200,w_200/carone/parts/part_101.jpg';
    expect(extractCloudinaryPublicId(url)).toBe('carone/parts/part_101');
  });

  it('extracts publicId from simple root-level image with version', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
    expect(extractCloudinaryPublicId(url)).toBe('sample');
  });

  it('extracts publicId from simple root-level image without version or transforms', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/sample.png';
    expect(extractCloudinaryPublicId(url)).toBe('sample');
  });

  it('handles raw delivery type (e.g. resumes/documents)', () => {
    const url = 'https://res.cloudinary.com/carone/raw/upload/v1700000000/resumes/applicant_cv.pdf';
    expect(extractCloudinaryPublicId(url)).toBe('resumes/applicant_cv');
  });

  it('handles authenticated and private delivery types', () => {
    const authUrl = 'https://res.cloudinary.com/carone/image/authenticated/s--xyz--/v12345/docs/id_card.jpg';
    expect(extractCloudinaryPublicId(authUrl)).toBe('docs/id_card');

    const privUrl = 'https://res.cloudinary.com/carone/image/private/v12345/docs/secret.png';
    expect(extractCloudinaryPublicId(privUrl)).toBe('docs/secret');
  });

  it('handles URL-encoded public IDs and paths', () => {
    const url = 'https://res.cloudinary.com/carone/image/upload/v1/folder%20name/image%20name.jpg';
    expect(extractCloudinaryPublicId(url)).toBe('folder name/image name');
  });

  it('returns null for non-Cloudinary URLs', () => {
    expect(extractCloudinaryPublicId('https://s3.amazonaws.com/bucket/image.jpg')).toBeNull();
    expect(extractCloudinaryPublicId('https://example.com/uploads/car.jpg')).toBeNull();
    expect(extractCloudinaryPublicId('http://localhost:4000/uploads/car.jpg')).toBeNull();
    expect(extractCloudinaryPublicId('/uploads/car.jpg')).toBeNull();
  });

  it('returns null for empty, null, undefined, or whitespace-only inputs', () => {
    expect(extractCloudinaryPublicId(null)).toBeNull();
    expect(extractCloudinaryPublicId(undefined)).toBeNull();
    expect(extractCloudinaryPublicId('')).toBeNull();
    expect(extractCloudinaryPublicId('   ')).toBeNull();
    expect(extractCloudinaryPublicId(123 as any)).toBeNull();
  });

  it('returns null for malformed or incomplete Cloudinary URLs', () => {
    expect(extractCloudinaryPublicId('https://res.cloudinary.com')).toBeNull();
    expect(extractCloudinaryPublicId('https://res.cloudinary.com/carone')).toBeNull();
    expect(extractCloudinaryPublicId('https://res.cloudinary.com/carone/image/upload/')).toBeNull();
    expect(extractCloudinaryPublicId('not-a-valid-url')).toBeNull();
  });
});
