/** Z-index scale — use these constants instead of arbitrary z-[N] values */
export const Z = {
  header: 40,         // AppHeader, SubPageHeader
  tabBar: 50,         // BottomTabBar
  sheet: 60,          // BivePreviewSheet
  presetOverlay: 80,  // PresetSelector loading/error overlay
  presetBackdrop: 89, // PresetSelector backdrop
  presetMenu: 90,     // PresetSelector menu
  modal: 100,         // BottomSheet, ConfirmModal
} as const;
