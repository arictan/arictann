// Optional rewarded ads and in-app purchases.
//
// Both run in TEST MODE until real accounts are connected:
// - Ads use Google's public AdMob test ad units on phones, and a simulated test ad in the browser.
//   Replace the IDs below with your own ad units from https://admob.google.com before release.
// - Purchases go through RevenueCat once REVENUECAT_API_KEY is set (products must also exist in
//   App Store Connect / Google Play Console). Until then the game simulates purchases, clearly
//   labelled as tests, so every flow can be tried without real money.

import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus, MaxAdContentRating } from '@capacitor-community/admob';
import { Purchases } from '@revenuecat/purchases-capacitor';

const native = Capacitor.isNativePlatform();
const ios = Capacitor.getPlatform() === 'ios';

// Google's official test rewarded ad units. Swap for your own before publishing.
const REWARDED_AD_ID = ios ? 'ca-app-pub-3940256099942544/1712485313' : 'ca-app-pub-3940256099942544/5224354917';
const ADS_TESTING = true;
// Ads are non-personalized: no advertising ID tracking, so no iOS tracking prompt is needed. Turn
// this on only together with the iOS App Tracking Transparency prompt and updated privacy forms.
const PERSONALIZED_ADS = false;

// Paste your RevenueCat public SDK key here to turn on real purchases.
const REVENUECAT_API_KEY = '';

export type ProductId = 'starter' | 'vip' | 'piggy' | 'pass' | 'restpass';

export interface Product { id: ProductId; storeId: string; name: string; price: string; desc: string }

export const PRODUCTS: Record<ProductId, Product> = {
  starter: { id: 'starter', storeId: 'sushistack.starter', name: 'Starter Pack', price: '$1.99', desc: '600 coins, 6 boosters and the exclusive Sakura Bento plate. One time only.' },
  vip: { id: 'vip', storeId: 'sushistack.vip.monthly', name: 'VIP Chef', price: '$4.99 / month', desc: 'Ad rewards without watching ads, +60 coins and 1 extra free chest every day.' },
  piggy: { id: 'piggy', storeId: 'sushistack.piggy', name: 'Piggy Bank', price: '$2.99', desc: 'Break the piggy bank and keep every coin saved inside.' },
  pass: { id: 'pass', storeId: 'sushistack.pass.premium', name: 'Premium Sushi Pass', price: '$4.99', desc: 'Unlocks the premium reward track for this season.' },
  restpass: { id: 'restpass', storeId: 'sushistack.restaurant.monthly', name: 'Restaurant Pass', price: '$2.99 / month', desc: '+50% tips, a tip jar that holds 4 hours more, the Imperial Gold theme and 4 exclusive decor styles.' },
};

export const monetize = {
  /** True when ads and purchases are simulated rather than real. */
  get testMode(): boolean {
    return !native || ADS_TESTING || !REVENUECAT_API_KEY;
  },
  get purchasesLive(): boolean {
    return native && !!REVENUECAT_API_KEY;
  },
};

let adsReady = false;
let consent = { canRequestAds: true, privacyOptions: false };

/** True in regions (EU/UK…) where players can reopen the ad privacy choices from Settings. */
export function adPrivacyOptionsAvailable(): boolean {
  return consent.privacyOptions;
}

/** Reopens Google's ad consent form (Settings → Ad privacy choices). */
export async function showAdPrivacyOptions(): Promise<void> {
  if (!native) return;
  try { await AdMob.showPrivacyOptionsForm(); } catch { /* not available */ }
}

export async function initMonetization(): Promise<void> {
  if (!native) return;
  try {
    // Google's consent form (UMP) is shown first where the law requires it (EU, UK, Switzerland).
    const info = await AdMob.requestConsentInfo();
    let status = info;
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) status = await AdMob.showConsentForm();
    consent = { canRequestAds: status.canRequestAds !== false, privacyOptions: String(status.privacyOptionsRequirementStatus) === 'REQUIRED' };
    await AdMob.initialize({ initializeForTesting: ADS_TESTING, tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false, maxAdContentRating: MaxAdContentRating.General });
    adsReady = consent.canRequestAds;
  } catch { /* ads unavailable */ }
  if (REVENUECAT_API_KEY) {
    try { await Purchases.configure({ apiKey: REVENUECAT_API_KEY }); } catch { /* store unavailable */ }
  }
}

/**
 * Shows a rewarded ad. Resolves true only if the player watched it to the end. In the browser
 * the game shows its own simulated test ad instead (see `simulateAd` in the game).
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!native || !adsReady) return false;
  try {
    await AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_ID, isTesting: ADS_TESTING, npa: !PERSONALIZED_ADS });
    const reward = await AdMob.showRewardVideoAd();
    return !!reward;
  } catch {
    return false;
  }
}

/** Real purchase through the store. Returns true when the store confirms it. */
export async function buyReal(id: ProductId): Promise<boolean> {
  if (!monetize.purchasesLive) return false;
  try {
    const { products } = await Purchases.getProducts({ productIdentifiers: [PRODUCTS[id].storeId] });
    if (!products.length) return false;
    await Purchases.purchaseStoreProduct({ product: products[0] });
    return true;
  } catch {
    return false; // cancelled or failed
  }
}

export const nativeAds = (): boolean => native && adsReady;
