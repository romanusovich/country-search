// то, что приходит от API (любое поле может отсутствовать)
export type RawCountry = {
  name?: string;
  nativeName?: string;
  capital?: string;
  region?: string;
  subregion?: string;
  demonym?: string;
  population?: number;
  area?: number;
  borders?: string[];
  flag?: string;
  flags?: { svg?: string; png?: string };
  languages?: { name?: string }[];
  currencies?: { code?: string; name?: string; symbol?: string }[];
};

// то, что нужно карточке и детальному виду
export type Country = {
  name: string;
  flag: string; // URL картинки, а если его нет - эмодзи или пустая строка
  capital: string;
  region: string;
  population: number;
  area: number;
  borders: string[];
  languages: string[];
  currencies: string[];
  description: string;
};
