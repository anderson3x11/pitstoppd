// Généré par scripts/fetchDriverPhotos.js — NE PAS ÉDITER MANUELLEMENT
// Photos pilotes depuis Wikipedia (EN) — fallback local avant mise en base

const DRIVER_PHOTOS = {
  'aitken': 'https://upload.wikimedia.org/wikipedia/commons/4/42/2023-05-27_Motorsport%2C_DTM%2C_Oschersleben_1DX_4952_by_Stepro_%28cropped%29.jpg',
  'albon': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Alex_Albon_%28cropped%29.jpg',
  'alonso': 'https://upload.wikimedia.org/wikipedia/commons/9/97/Alonso-68_%2824710447098%29.jpg',
  'antonelli': 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Kimi_Antonelli_at_the_2025_US_Grand_Prix_in_Austin%2C_TX_%28cropped%29.jpg',
  'bearman': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/2025_Japan_GP_-_Haas_-_Oliver_Bearman_-_Thursday_%28cropped%29.jpg',
  'bortoleto': 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Gabriel_Bortoleto_%28cropped%29.jpg',
  'bottas': 'https://upload.wikimedia.org/wikipedia/commons/9/93/Valtteri_Bottas_at_the_2026_Adelaide_Motorsport_Festival_%28028A7567%29.jpg',
  'colapinto': 'https://upload.wikimedia.org/wikipedia/commons/7/79/Conferencia_de_prensa_Colapinto_ACA_octubre_2023_-_BugWarp_%2813%29_%28cropped%29.jpg',
  'de_vries': 'https://upload.wikimedia.org/wikipedia/commons/5/56/TGR_Nyck_de_Vries_240908.jpg',
  'doohan': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Jack_Doohan_2023.jpg',
  'pietro_fittipaldi': 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Pietro_Fittipaldi_Stock_Car_2021.png',
  'gasly': 'https://upload.wikimedia.org/wikipedia/commons/f/fd/2022_French_Grand_Prix_%2852279065728%29_%28midcrop%29.png',
  'giovinazzi': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Antonio_Giovinazzi_-_Ferrari_499P_-_Hybrid_during_the_pitwalk_at_the_2023_Le_Mans_%2853468237574%29.jpg',
  'grosjean': 'https://upload.wikimedia.org/wikipedia/commons/5/58/Grosjean_at_2024_Chevrolet_Detroit_Grand_Prix.jpg',
  'hadjar': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Isack_Hadjar_2025.png',
  'hamilton': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg',
  'hulkenberg': 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Nico_Hulkenberg_2016_Malaysia.jpg',
  'kubica': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Robert_Kubica_at_Monza_2023.jpg',
  'kvyat': 'https://upload.wikimedia.org/wikipedia/commons/0/09/Daniil_Kvyat_2024_Suzuka_A2RL_%28cropped%29.jpg',
  'latifi': 'https://upload.wikimedia.org/wikipedia/commons/5/58/Nicholas_Latifi_at_Singapore_in_2022_%28cropped%29.jpg',
  'lawson': 'https://upload.wikimedia.org/wikipedia/commons/5/53/Liam_Lawson_at_the_Red_Bull_Fan_Zone_%E2%80%93_Crown_Riverwalk%2C_Melbourne_%28028A7793%29.jpg',
  'leclerc': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3978_by_Stepro_%28cropped2%29.jpg',
  'kevin_magnussen': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Kevin_Magnussen%2C_2019_Formula_One_Tests_Barcelona_%28cropped%29.jpg',
  'mazepin': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/%D0%9D%D0%B8%D0%BA%D0%B8%D1%82%D0%B0_%D0%9C%D0%B0%D0%B7%D0%B5%D0%BF%D0%B8%D0%BD_-_%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D0%B2%D1%8C%D1%8E_-_2019%2C_02.jpg',
  'norris': 'https://upload.wikimedia.org/wikipedia/commons/9/90/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3968_by_Stepro_%28cropped2%29.jpg',
  'ocon': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Esteban_Ocon_2024_Suzuka_%28cropped%29.jpg',
  'perez': 'https://upload.wikimedia.org/wikipedia/commons/5/55/2021_US_GP_driver_parade_%28cropped2%29.jpg',
  'piastri': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Oscar_Piastri_2024_%28cropped%29.jpg',
  'raikkonen': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/F12019_Schloss_Gabelhofen_%2822%29_%28cropped%29.jpg',
  'ricciardo': 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Daniel_Ricciardo_January_2024.jpg',
  'russell': 'https://upload.wikimedia.org/wikipedia/commons/7/7f/KingsLeonSilverstne040724_%2828_of_112%29_%2853838006028%29_%28cropped%29.jpg',
  'sainz': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Formula1Gabelhofen2022_%2804%29_%28cropped2%29.jpg',
  'sargeant': 'https://upload.wikimedia.org/wikipedia/commons/0/02/Logan_Sargeant_NYC_%28cropped%29.jpg',
  'mick_schumacher': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Mick_Schumacher_2024_WEC_Fuji.jpg',
  'stroll': 'https://upload.wikimedia.org/wikipedia/commons/4/4e/2025_Japan_GP_-_Aston_Martin_-_Lance_Stroll_-_Fanzone_Stage_%28cropped%29.jpg',
  'tsunoda': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Yuki_Tsunoda_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8096%29.jpg',
  'max_verstappen': 'https://upload.wikimedia.org/wikipedia/commons/5/52/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg',
  'vettel': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg',
  'zhou': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Zhou_Guanyu_at_the_2022_Austrian_Grand_Prix.jpg/3456px-Zhou_Guanyu_at_the_2022_Austrian_Grand_Prix.jpg',
}

export function getDriverPhoto(driver) {
  return driver.photo_url ?? DRIVER_PHOTOS[driver.id] ?? null
}
