# Tradovia phone widgets — implementation handoff

## Available in the web app now

The `Widgets` destination in the desktop sidebar and mobile More menu is a
working preview gallery. It reads the selected portfolio's actual journal data
from the current workspace session. Eight layouts show today, quick capture,
week result, review queue, seven-day calendar, latest trade, active days, and
market shortcuts. Taps open the corresponding Tradovia view; the quick-capture
tile opens the existing Add Trade flow. The amount-visibility control is a
local preview control, not a device-wide privacy setting.

`lib/widget-snapshot.ts` is the pure, timezone-aware data selector. Closed-trade
results alone contribute to P&L. The gallery does not make a second API request
or publish private values to a third-party widget provider.

Mobile browser QA covered 375, 390, 393 and 430px in Thai and English, with
light and dark appearances. The gallery stayed within the viewport, and the
privacy control and Add Trade shortcut worked. This does not replace testing
on physical iOS and Android devices. Published to the Cloudflare app as Worker
version `d492c0d0-ad40-4ab4-9803-fe376f327bff` on 2026-09-27; the public
demo is `/demo#widgets`.

These are **web previews**, not installable iOS or Android home-screen widgets.
Do not advertise them as installed widgets or show an Add to Home Screen button
that implies WidgetKit/App Widgets support.

## Native implementation sequence

1. Establish the native app shell and Auth0 session model. Define a minimal
   authenticated widget snapshot endpoint, scoped to the user and selected
   portfolio, with no broker credential or unnecessary trade notes/images.
2. Implement iOS WidgetKit small, medium, large and appropriate Lock Screen
   layouts. Implement Android App Widgets with responsive size variants and
   direct links to Today, Journal, Calendar and Add Trade. Use the approved
   Tradovia mark, type scale and semantic profit/loss colors.
3. Cache the last authorized snapshot on-device, show its as-of time, and
   handle signed-out, empty, loading and stale states. Keep financial values
   hidden by default on Lock Screen; offer an explicit privacy preference for
   Home Screen widgets.
4. Refresh after a successful journal save and on an OS-appropriate schedule.
   Widgets must not promise tick-by-tick or immediate MT5 updates. Measure the
   actual refresh cadence on devices before wording any freshness claim.
5. Add market prices only through a provider whose contract permits display
   and redistribution in third-party native widgets for the target symbols and
   regions. Show source, timestamp and delayed/live status. Until then, the
   market widget remains a shortcut to the existing in-app TradingView view.
6. Test Thai and English, light and dark, privacy states, dynamic type, screen
   readers, offline behavior and all supported widget sizes on real devices.

## Market-data boundary

TradingView web widgets can be embedded in Tradovia's **web Market page**.
That embed is not a raw price API for Tradovia's own native widgets. TradingView's
Advanced Charts library also requires a separate datafeed. Do not scrape
TradingView prices, copy them into D1, or silently treat an exchange-delayed
quote as live.

Official references:

- [TradingView widget embedding](https://www.tradingview.com/widget-docs/tutorials/)
- [TradingView Advanced Charts datafeed](https://www.tradingview.com/charting-library-docs/latest/connecting_data/)
- [TradingView data terms](https://www.tradingview.com/policies/)
- [Apple WidgetKit refresh guidance](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date/)
- [Android App Widgets overview](https://developer.android.com/develop/ui/views/appwidgets/overview)
