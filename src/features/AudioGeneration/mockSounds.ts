import { SoundItemData } from './SoundItem';

// AI Reference sounds organized by genre
export const aiReferenceSounds: SoundItemData[] = [
  {
    id: 'ref_classical',
    title: 'Classical',
    audioUrl: '/audio/reference/Classical.mp3',
    imageUrl: '/images/audio/Classical.jpeg',
    genre: 'Classical',
  },
  {
    id: 'ref_jazz',
    title: 'Jazz',
    audioUrl: '/audio/reference/Jazz.mp3',
    imageUrl: '/images/audio/Jazz.jpeg',
    genre: 'Jazz',
  },
  {
    id: 'ref_hiphop',
    title: 'Hip Hop',
    audioUrl: '/audio/reference/Hip-hop.mp3',
    imageUrl: '/images/audio/Hip-hop.jpeg',
    genre: 'Hip Hop',
  },
  {
    id: 'ref_chill',
    title: 'Chill lo-fi beat',
    audioUrl: '/audio/reference/Chill lo-fi beat.mp3',
    imageUrl: '/images/audio/Chill lo-fi beat.jpeg',
    genre: 'Lo-fi',
  },
  {
    id: 'ref_rap',
    title: 'Rap',
    audioUrl: '/audio/reference/Rap.mp3',
    imageUrl: '/images/audio/Rap.jpeg',
    genre: 'Rap',
  },
  {
    id: 'ref_soviet_rock',
    title: 'Soviet Rock',
    audioUrl: '/audio/reference/Soviet Rock.mp3',
    imageUrl: '/images/audio/Soviet Rock.jpeg',
    genre: 'Rock',
  },
];

// Trending sounds
export const trendingSounds: SoundItemData[] = [
  {
    id: 'trend_street_surge',
    title: 'Street Surge',
    audioUrl: '/audio/Trend/Street Surge.mp3',
    imageUrl: '/images/audio/Street Surge.jpeg',
    genre: 'Electronic',
  },
  {
    id: 'trend_moonlight',
    title: 'Moonlight in Her Eyes',
    audioUrl: '/audio/Trend/Moonlight in Her Eyes.mp3',
    imageUrl: '/images/audio/Moonlight in Her Eyes.jpeg',
    genre: 'Ambient',
  },
  {
    id: 'trend_v_tu_noch',
    title: 'В ту ночь',
    audioUrl: '/audio/Trend/В ту ночь.mp3',
    imageUrl: '/images/audio/В ту ночь.jpeg',
    genre: 'Pop',
  },
  {
    id: 'trend_veter',
    title: 'Ветер сквозь пальцы',
    audioUrl: '/audio/Trend/Ветер сквозь пальцы.mp3',
    imageUrl: '/images/audio/Ветер сквозь пальцы.jpeg',
    genre: 'Rock',
  },
  {
    id: 'trend_krylataya_ten',
    title: 'Крылатая тень',
    audioUrl: '/audio/Trend/Крылатая тень.mp3',
    imageUrl: '/images/audio/Крылатая тень.jpeg',
    genre: 'Metal',
  },
  {
    id: 'trend_voina',
    title: 'Война без сердца',
    audioUrl: '/audio/Trend/Война без сердца.mp3',
    imageUrl: '/images/audio/Война без сердца.jpeg',
    genre: 'Rock',
  },
  {
    id: 'trend_flag',
    title: 'Вечный Флаг',
    audioUrl: '/audio/Trend/Вечный Флаг.mp3',
    imageUrl: '/images/audio/Вечный Флаг.jpeg',
    genre: 'Rock',
  },
];

// Данные для галереи пользователя (пока пустые)
export const userGallerySounds: SoundItemData[] = []; 