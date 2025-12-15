declare global {
  interface Window {
    google: typeof google;
    initGoogleMapsAutocomplete: () => void;
  }
}

declare namespace google {
  namespace maps {
    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void;
    }

    interface GeocoderRequest {
      address?: string;
      bounds?: LatLngBounds;
      componentRestrictions?: GeocoderComponentRestrictions;
      location?: LatLng;
      placeId?: string;
      region?: string;
    }

    interface GeocoderComponentRestrictions {
      administrativeArea?: string;
      country?: string;
      locality?: string;
      postalCode?: string;
      route?: string;
    }

    interface GeocoderResult {
      address_components: GeocoderAddressComponent[];
      formatted_address: string;
      geometry: GeocoderGeometry;
      place_id: string;
      types: string[];
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface GeocoderGeometry {
      bounds?: LatLngBounds;
      location: LatLng;
      location_type: GeocoderLocationType;
      viewport: LatLngBounds;
    }

    enum GeocoderLocationType {
      APPROXIMATE = 'APPROXIMATE',
      GEOMETRIC_CENTER = 'GEOMETRIC_CENTER',
      RANGE_INTERPOLATED = 'RANGE_INTERPOLATED',
      ROOFTOP = 'ROOFTOP',
    }

    enum GeocoderStatus {
      ERROR = 'ERROR',
      INVALID_REQUEST = 'INVALID_REQUEST',
      OK = 'OK',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      ZERO_RESULTS = 'ZERO_RESULTS',
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(point: LatLng): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      isEmpty(): boolean;
      toSpan(): LatLng;
      toString(): string;
      toUrlValue(precision?: number): string;
      union(other: LatLngBounds): LatLngBounds;
    }

    namespace places {
      class Autocomplete {
        constructor(
          inputField: HTMLInputElement,
          opts?: AutocompleteOptions
        );
        addListener(eventName: string, handler: () => void): void;
        bindTo(bounds: LatLngBounds): void;
        getPlace(): PlaceResult;
        setBounds(bounds: LatLngBounds): void;
        setComponentRestrictions(restrictions: AutocompleteComponentRestrictions): void;
        setFields(fields: string[]): void;
        setOptions(options: AutocompleteOptions): void;
        setTypes(types: string[]): void;
        unbindAll(): void;
      }

      interface AutocompleteOptions {
        bounds?: LatLngBounds;
        componentRestrictions?: AutocompleteComponentRestrictions;
        fields?: string[];
        origin?: LatLng;
        radius?: number;
        sessionToken?: AutocompleteSessionToken;
        types?: string[];
      }

      interface AutocompleteComponentRestrictions {
        country: string | string[];
      }

      class AutocompleteSessionToken {
        constructor();
      }

      interface PlaceResult {
        address_components?: GeocoderAddressComponent[];
        adr_address?: string;
        aspects?: PlaceAspectRating[];
        business_status?: BusinessStatus;
        formatted_address?: string;
        geometry?: PlaceGeometry;
        html_attributions?: string[];
        icon?: string;
        icon_background_color?: string;
        icon_mask_base_uri?: string;
        name?: string;
        opening_hours?: PlaceOpeningHours;
        permanently_closed?: boolean;
        photos?: PlacePhoto[];
        place_id?: string;
        plus_code?: PlacePlusCode;
        price_level?: PriceLevel;
        rating?: number;
        reviews?: PlaceReview[];
        types?: string[];
        url?: string;
        user_ratings_total?: number;
        utc_offset_minutes?: number;
        vicinity?: string;
        website?: string;
      }

      interface PlaceAspectRating {
        rating: number;
        type: string;
      }

      enum BusinessStatus {
        CLOSED_PERMANENTLY = 'CLOSED_PERMANENTLY',
        CLOSED_TEMPORARILY = 'CLOSED_TEMPORARILY',
        OPERATIONAL = 'OPERATIONAL',
      }

      interface PlaceGeometry {
        location?: LatLng;
        viewport?: LatLngBounds;
      }

      interface PlaceOpeningHours {
        open_now?: boolean;
        periods?: PlaceOpeningHoursPeriod[];
        weekday_text?: string[];
      }

      interface PlaceOpeningHoursPeriod {
        close?: PlaceOpeningHoursTime;
        open: PlaceOpeningHoursTime;
      }

      interface PlaceOpeningHoursTime {
        day: number;
        time: string;
      }

      interface PlacePhoto {
        height: number;
        html_attributions: string[];
        width: number;
        getUrl(opts?: PhotoOptions): string;
      }

      interface PhotoOptions {
        maxHeight?: number;
        maxWidth?: number;
      }

      interface PlacePlusCode {
        compound_code?: string;
        global_code: string;
      }

      enum PriceLevel {
        FREE = 0,
        INEXPENSIVE = 1,
        MODERATE = 2,
        EXPENSIVE = 3,
        VERY_EXPENSIVE = 4,
      }

      interface PlaceReview {
        aspects?: PlaceAspectRating[];
        author_name: string;
        author_url?: string;
        language: string;
        profile_photo_url?: string;
        rating: number;
        relative_time_description: string;
        text: string;
        time: number;
      }
    }
  }
}

export {}; 