import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import middleware from '../middleware';

describe('Middleware Locale & Legal Routes Protection', () => {
  it('redirects /en/browse with 308 to /ar/browse', () => {
    const req = new NextRequest('https://souqoneom.com/en/browse');
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://souqoneom.com/ar/browse');
  });

  it('redirects /en/cars with 308 to /ar/cars', () => {
    const req = new NextRequest('https://souqoneom.com/en/cars');
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://souqoneom.com/ar/cars');
  });

  it('redirects bare root / to /ar (Arabic default)', () => {
    const req = new NextRequest('https://souqoneom.com/', {
      headers: { 'accept-language': 'en-US,en;q=0.9' },
    });
    const res = middleware(req);
    // Should redirect to /ar because localeDetection is disabled
    expect(res.headers.get('location')).toMatch(/\/ar$/);
  });

  it('redirects bare /privacy to /ar/privacy', () => {
    const req = new NextRequest('https://souqoneom.com/privacy', {
      headers: { 'accept-language': 'en-US,en;q=0.9' },
    });
    const res = middleware(req);
    expect(res.headers.get('location')).toMatch(/\/ar\/privacy$/);
  });

  it('redirects bare /terms to /ar/terms', () => {
    const req = new NextRequest('https://souqoneom.com/terms');
    const res = middleware(req);
    expect(res.headers.get('location')).toMatch(/\/ar\/terms$/);
  });

  it('redirects bare /delete-account to /ar/delete-account', () => {
    const req = new NextRequest('https://souqoneom.com/delete-account');
    const res = middleware(req);
    expect(res.headers.get('location')).toMatch(/\/ar\/delete-account$/);
  });

  it('allows /en/privacy through without 308 redirect to /ar/privacy', () => {
    const req = new NextRequest('https://souqoneom.com/en/privacy');
    const res = middleware(req);
    // Does not redirect with 308 to /ar
    expect(res.status).not.toBe(308);
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /en/terms through without 308 redirect to /ar/terms', () => {
    const req = new NextRequest('https://souqoneom.com/en/terms');
    const res = middleware(req);
    expect(res.status).not.toBe(308);
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /en/delete-account through without 308 redirect to /ar/delete-account', () => {
    const req = new NextRequest('https://souqoneom.com/en/delete-account');
    const res = middleware(req);
    expect(res.status).not.toBe(308);
    expect(res.headers.get('location')).toBeNull();
  });
});
