# Videoafspiller Guide for Kunder

Denne guide forklarer, hvordan du bruger og tilpasser videoafspilleren på din hjemmeside. Videoafspilleren understøtter forhåndsvisningsløkker, lightbox-visning og responsivt design.

## Grundlæggende Opsætning

Den nemmeste måde at tilføje en video er at kopiere og indsætte denne kode:

```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="DIN_VIMEO_ID"
     tabindex="0"
     role="button" 
     aria-label="Klik for at afspille video i fuldskærm">
</div>
```

Erstat `DIN_VIMEO_ID` med din Vimeo video-ID (tallene i slutningen af din Vimeo URL).

## Tilgængelige Indstillinger

### Video Tilstande
- `preview-with-lightbox`: Viser en forhåndsvisningsløkke og åbner i lightbox ved klik
- `preview-only`: Viser kun forhåndsvisningsløkken uden lightbox-mulighed

### Grundlæggende Indstillinger
- `data-video-id`: Din Vimeo video-ID eller URL
- `data-video-start-time`: Hvornår forhåndsvisningen skal starte (i sekunder)
- `data-video-end-time`: Hvornår forhåndsvisningen skal slutte (i sekunder)

### Portrættilstand Understøttelse
- `data-portrait-video-id`: En anden video der vises i portrættilstand (9:16)
- `data-responsive`: Aktiver responsiv størrelse

### Tilpasset Størrelse
- `data-aspect-ratio`: Tilpasset billedformat (f.eks. "16/9")
- `data-mobile-aspect-ratio`: Andet billedformat til mobile enheder

## Eksempler

### Grundlæggende Forhåndsvisning med Lightbox
```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="123456789"
     tabindex="0"
     role="button" 
     aria-label="Klik for at afspille video i fuldskærm">
</div>
```

### Forhåndsvisning med Tilpasset Timing
```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="123456789"
     data-video-start-time="10"
     data-video-end-time="25"
     tabindex="0"
     role="button" 
     aria-label="Klik for at afspille video i fuldskærm">
</div>
```

### Portrættilstand Understøttelse
```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="123456789"
     data-portrait-video-id="987654321"
     data-responsive
     tabindex="0"
     role="button" 
     aria-label="Klik for at afspille video i fuldskærm">
</div>
```

### Tilpasset Billedformat
```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="123456789"
     data-aspect-ratio="21/9"
     data-mobile-aspect-ratio="16/9"
     data-responsive
     tabindex="0"
     role="button" 
     aria-label="Klik for at afspille video i fuldskærm">
</div>
```

## Tips

1. **Find Din Vimeo ID**
   - Gå til din video på Vimeo
   - ID'et er tallene i slutningen af URL'en
   - Eksempel: `https://vimeo.com/123456789` → ID er `123456789`

2. **Timing af Forhåndsvisninger**
   - `data-video-start-time`: Hvornår den skal starte (i sekunder)
   - `data-video-end-time`: Hvornår den skal slutte (i sekunder)
   - Hvis ikke angivet, starter forhåndsvisningen ved 0 og afspiller i 30 sekunder

3. **Portrættilstand**
   - Brug `data-portrait-video-id` for en anden video i portrættilstand
   - Portrætvideoen skal være i 9:16 billedformat
   - Lightbox vil altid vise landskabsversionen

4. **Responsivt Design**
   - Tilføj `data-responsive` for at aktivere automatisk størrelse
   - Brug `data-aspect-ratio` for tilpassede proportioner
   - Brug `data-mobile-aspect-ratio` for forskellige mobile proportioner

## Almindelige Problemer

1. **Video Afspiller Ikke**
   - Tjek om Vimeo ID'et er korrekt
   - Sørg for at videoen er offentlig eller uoplistet
   - Verificer at videoen ikke er blevet slettet

2. **Problemer med Forhåndsvisningstiming**
   - Sørg for at start- og sluttider er inden for videolængden
   - Tider skal være i sekunder (hele tal)

3. **Portrættilstand Virker Ikke**
   - Verificer at begge video-ID'er er korrekte
   - Sørg for at `data-responsive` er tilføjet
   - Tjek om enheden faktisk er i portrættilstand

## Brug for Hjælp?

Hvis du skal lave ændringer i videoafspilleren:
1. Find video-containeren i din HTML
2. Tilføj eller ændr data-attributterne efter behov
3. Gem og opdater din side

For mere komplekse ændringer, kontakt venligst din udvikler. 