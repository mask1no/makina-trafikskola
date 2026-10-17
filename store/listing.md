# Makina Trafikskola — butik

Paket-id, båda butikerna: `se.makina.trafikskola`

Sajten appen öppnar: https://www.makina.se

Integritet: https://www.makina.se/sv/integritet

Support: https://www.makina.se/sv/kontakt

## Det du gör i kontona

1. Acceptera inbjudan i App Store Connect och Google Play Console, i klientens team.
2. Skapa appen med paket-id `se.makina.trafikskola`.
3. I Codemagic, koppla repot och lägg in:
   - Apple: distribution certificate och App Store-profil för `se.makina.trafikskola`
   - Android: ett uppladdningscertifikat med referensnamnet `makina_upload`
   - miljögruppen `makina_store`
   - variabeln `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` (JSON från Play Console)
   - App Store Connect-integrationen som arbetsflödet publicerar med
4. Kör arbetsflödet `makina-shell`. Debug-APK byggs utan certifikat. När certifikaten finns, lägg till blocken nedan i `codemagic.yaml` under `environment` och sist i arbetsflödet. IPA och App Bundle kräver certifikaten. Publicering till TestFlight och Play internal kräver båda integrationerna.

```yaml
      ios_signing:
        distribution_type: app_store
        bundle_identifier: se.makina.trafikskola
      android_signing:
        - makina_upload
    publishing:
      app_store_connect:
        auth: integration
        submit_to_testflight: true
      google_play:
        credentials: $GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS
        track: internal
```

`android_signing` och `ios_signing` hör hemma under `environment`. `publishing` är ett eget fält bredvid `artifacts`. Android-nyckelns referensnamn i Codemagic ska vara `makina_upload`.

## Svensk butikstext

Namn: Makina Trafikskola

Kort text: Boka körlektion i Farsta och Upplands Väsby.

Beskrivning:

Makina Trafikskola är körskolan i Farsta och Upplands Väsby. Boka körlektion, välj lärare och betala i appen.

Du kan öva teori, se priser och paket, och följa dina bokningar. Lärare och administratörer använder samma app för schema, elever och meddelanden.

Hämtning ingår i Farsta och Upplands Väsby. Avbokning senast 24 timmar före lektionen kostar inget.

Undervisning på svenska, engelska, tigrinja och kurdiska. Webbplatsen finns även på arabiska, amhariska och somaliska.

## English store text

Name: Makina Trafikskola

Short text: Book a driving lesson in Farsta and Upplands Väsby.

Description:

Makina Trafikskola is the driving school in Farsta and Upplands Väsby. Book a lesson, choose an instructor and pay in the app.

Practise theory, compare prices and packages, and follow your bookings. Instructors and administrators use the same app for the calendar, students and messages.

Pickup is included in Farsta and Upplands Väsby. Cancelling at least 24 hours before the lesson is free.

Lessons are taught in Swedish, English, Tigrinya and Kurdish. The site is also available in Arabic, Amharic and Somali.

## Notes for App Review

Makina Trafikskola is our own driving school in Stockholm. The app is the school site, with the same login, booking and card payment as https://www.makina.se. Sign in with email and password, or with Google and a one-time SMS check. A demo account can be created on request. Teacher photos use the camera and photo library. The app does not offer a separate account from the website.

## Screenshots to take on a device

Phone: home, prices, book a lesson, theory, contact.

iPad: home and the booking steps.

Play feature graphic can be the dark M mark on `#0D0D0F`.

Do not put a star rating in the screenshots.
