export type FooStyle = "photoreal" | "cartoon" | "illustration" | "action-figure";

export const STYLE_PRESETS: Record<FooStyle, string> = {
  photoreal:
    "Professional portrait photography, cinematic lighting, West Coast streetwear aesthetic, urban fashion, modern styling with tasteful jewelry, shallow depth of field, bokeh background, 35mm lens, natural colors, high detail, photorealistic, studio quality, facial features preserved",
  cartoon:
    "Bold cartoon illustration style, clean vector art, thick outlines, flat colors, vibrant palette, simplified shapes while maintaining facial recognition, urban streetwear clothing, modern cartoon aesthetic, professional character design, expressive",
  illustration:
    "Hand-painted digital illustration, poster art style, rich textures, dramatic shading, bold colors, street art mural aesthetic, detailed brushwork, artistic yet recognizable portrait, urban contemporary art style, graphic novel quality",
  "action-figure":
    "Highly detailed collectible action figure, 1:6 scale toy photography, matte plastic finish, studio product lighting, soft shadows, neutral backdrop, realistic toy sculpt with facial likeness, premium collectible quality, shelf display worthy"
};

export const STYLE_DISPLAY_NAMES: Record<FooStyle, string> = {
  photoreal: "Photo Real",
  cartoon: "Cartoon",
  illustration: "Illustration",
  "action-figure": "Action Figure"
};

export const STYLE_DESCRIPTIONS: Record<FooStyle, string> = {
  photoreal: "Cinematic, photorealistic West Coast style with natural lighting",
  cartoon: "Bold vector cartoon with clean lines and vibrant colors",
  illustration: "Hand-illustrated poster art with rich texture and drama",
  "action-figure": "Collectible action figure with studio product lighting"
};

// Entitlement limits
export interface FooMeEntitlements {
  maxVariants: number;
  resolution: number;
  watermarked: boolean;
  transparentBackground: boolean;
  premiumStyles: boolean;
}

export const FREE_ENTITLEMENTS: FooMeEntitlements = {
  maxVariants: 1,
  resolution: 512,
  watermarked: true,
  transparentBackground: false,
  premiumStyles: false
};

export const PRO_ENTITLEMENTS: FooMeEntitlements = {
  maxVariants: 4,
  resolution: 1024,
  watermarked: false,
  transparentBackground: true,
  premiumStyles: true
};

