const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CLUSTERS = [
  // Cluster 1: Cairo & Pyramids Day Trip with GEM from Hurghada
  {
    clusterId: 'cairo-gem-hurghada',
    clusterName: 'Cluster 1: Cairo Tours (Hurghada to GEM)',
    masterSlug: 'cairo-pyramids-grand-egyptian-museum',
    durationHours: 16,
    durationText: '16-18 Hours (Full Day)',
    adultPrice: 45,
    originalPrice: 60,
    options: [
      {
        id: 'opt-cairo-standard-coach',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Standard Coach Tour (Pyramids, Sphinx & GEM)',
          ru: 'Стандартный тур на автобусе (Пирамиды, Сфинкс и GEM)',
          de: 'Standard-Bustour (Pyramiden, Sphinx & GEM)',
          fr: 'Visite standard en autocar (Pyramides, Sphinx & GEM)',
          it: 'Tour standard in pullman (Piramidi, Sfinge e GEM)',
          pl: 'Standardowa wycieczka autokarowa (Piramidy, Sfinks i GEM)',
          es: 'Tour estándar en autocar (Pirámides, Esfinge y GEM)',
          uk: 'Стандартний тур на автобусі (Піраміди, Сфінкс та GEM)'
        },
        descriptions: {
          en: 'Air-conditioned luxury coach transfer from Hurghada with licensed Egyptologist guide and buffet lunch.',
          ru: 'Трансфер на комфортабельном автобусе с кондиционером из Хургады, гид-египтолог и обед-шведский стол.',
          de: 'Klimatisierter Reisebus ab Hurghada mit lizenziertem Ägyptologen und Mittagsbuffet.',
          fr: 'Transfert en autocar climatisé depuis Hurghada avec guide égyptologue et déjeuner buffet.',
          it: 'Trasferimento in pullman con aria condizionata da Hurghada con guida egittologa e pranzo a buffet.',
          pl: 'Klimatyzowany autokar z Hurghady z licencjonowanym egiptologiem i obiadem w formie bufetu.',
          es: 'Traslado en autocar con aire acondicionado desde Hurghada con guía egiptólogo y almuerzo buffet.',
          uk: 'Трансфер комфортабельним автобусом з кондиціонером з Хургади з гідом-єгиптологом та обідом.'
        }
      },
      {
        id: 'opt-cairo-vip-minibus',
        price: 45, // +$45 addon = $90 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'VIP Small Group (Max 12 Guests, Deluxe Minibus)',
          ru: 'VIP Мини-группа (До 12 человек, микроавтобус люкс)',
          de: 'VIP-Kleingruppe (Max. 12 Gäste, Deluxe-Minibus)',
          fr: 'VIP Petit groupe (Max 12 personnes, minibus deluxe)',
          it: 'VIP Piccolo gruppo (Max 12 persone, minibus deluxe)',
          pl: 'VIP Mała grupa (Maks. 12 osób, luksusowy minibus)',
          es: 'VIP Grupo reducido (Máx. 12 personas, minibús de lujo)',
          uk: 'VIP Міні-група (До 12 осіб, мікроавтобус люкс)'
        },
        descriptions: {
          en: 'Fast, intimate small-group experience with expedited entry tickets, private table lunch and flexible schedule.',
          ru: 'Быстрый и комфортный формат малой группы с ускоренным входом, отдельным столиком на обеде и гибким графиком.',
          de: 'Schnelles Kleingruppenerlebnis mit Schnelleinlass, privatem Tisch beim Mittagessen und flexiblem Zeitplan.',
          fr: 'Expérience en petit groupe avec billets coupe-file, table privée pour le déjeuner et flexibilité.',
          it: 'Esperienza in piccolo gruppo con ingresso prioritario, tavolo privato a pranzo e flessibilità.',
          pl: 'Kameralna grupa z biletami bez kolejki, prywatnym stolikiem podczas obiadu i elastycznym czasem.',
          es: 'Experiencia en grupo reducido con entradas preferentes, mesa privada para el almuerzo y flexibilidad.',
          uk: 'Швидкий та комфортний формат малої групи з прискореним входом, окремим столиком на обіді.'
        }
      }
    ],
    duplicateSlugs: [
      'cairo-gem-pyramids-day-trip',
      'grand-egyptian-museum-super-tour'
    ]
  },

  // Cluster 2: Luxor Valley of the Kings & Karnak Day Trip from Hurghada
  {
    clusterId: 'luxor-karnak-hurghada',
    clusterName: 'Cluster 2: Luxor Tours (Valley of Kings & Karnak)',
    masterSlug: 'luxor-valley-of-the-kings-karnak-day-trip',
    durationHours: 16,
    durationText: '16 Hours (Full Day)',
    adultPrice: 45,
    originalPrice: 65,
    options: [
      {
        id: 'opt-luxor-standard-coach',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Standard Coach Tour (Kings Valley, Karnak, Hatshepsut)',
          ru: 'Стандартный автобусный тур (Долина Царей, Карнак, Хатшепсут)',
          de: 'Standard-Bustour (Tal der Könige, Karnak, Hatschepsut)',
          fr: 'Visite standard en autocar (Vallée des Rois, Karnak, Hatchepsout)',
          it: 'Tour standard in pullman (Valle dei Re, Karnak, Hatshepsut)',
          pl: 'Standardowa wycieczka autokarowa (Dolina Królów, Karnak, Hatszepsut)',
          es: 'Tour estándar en autocar (Valle de los Reyes, Karnak, Hatshepsut)',
          uk: 'Стандартний автобусний тур (Долина Царів, Карнак, Хатшепсут)'
        },
        descriptions: {
          en: 'Full-day cultural tour including Karnak Temple, Colossi of Memnon, Valley of the Kings, Hatshepsut and Nile motorboat crossing.',
          ru: 'Полный экскурсионный день: Карнакский храм, колоссы Мемнона, Долина Царей, храм Хатшепсут и переправа через Нил.',
          de: 'Ganztägige Kulturtour inklusive Karnak-Tempel, Memnonkolosse, Tal der Könige, Hatschepsut und Nil-Motorbootfahrt.',
          fr: 'Journée culturelle complète avec Karnak, les Colosses de Memnon, la Vallée des Rois et Hatchepsout.',
          it: 'Giornata culturale completa: tempio di Karnak, colossi di Memnone, Valle dei Re, Hatshepsut e traversata del Nilo.',
          pl: 'Całodniowa wycieczka kulturowa: Karnak, Kolosy Memnona, Dolina Królów, Hatszepsut i przeprawa przez Nil.',
          es: 'Tour cultural de día completo: Karnak, Colosos de Memnón, Valle de los Reyes, Hatshepsut y paseo en barca por el Nilo.',
          uk: 'Повний екскурсійний день: Карнакський храм, колоси Мемнона, Долина Царів, храм Хатшепсут.'
        }
      },
      {
        id: 'opt-luxor-mini-group',
        price: 30, // +$30 = $75 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Mini-Group Comfort (Max 10 Guests in Deluxe Sprinter)',
          ru: 'Мини-группа Комфорт (До 10 человек в Mercedes Sprinter)',
          de: 'Mini-Gruppenkomfort (Max. 10 Gäste im Deluxe Sprinter)',
          fr: 'Mini-groupe Confort (Max 10 personnes en Sprinter Deluxe)',
          it: 'Mini-gruppo Comfort (Max 10 persone in Sprinter Deluxe)',
          pl: 'Mini-grupa Komfort (Maks. 10 osób w luksusowym Sprinterze)',
          es: 'Mini-grupo Confort (Máx. 10 personas en Sprinter Deluxe)',
          uk: 'Міні-група Комфорт (До 10 осіб у Mercedes Sprinter)'
        },
        descriptions: {
          en: 'Save 2+ hours on hotel pickups with a swift 10-person Mercedes Sprinter, dedicated guide and premium riverside restaurant lunch.',
          ru: 'Экономия до 2 часов на сборах из отелей на микроавтобусе Mercedes Sprinter, персональный гид и обед на берегу Нила.',
          de: 'Sparen Sie über 2 Stunden bei der Hotelabholung im schnellen 10-Personen-Sprinter mit persönlichem Guide und Premium-Mittagessen.',
          fr: 'Gain de 2h sur les ramassages d’hôtels en minibus 10 places, guide dédié et déjeuner au bord du Nil.',
          it: 'Risparmia oltre 2 ore sui trasferimenti con minibus da 10 posti, guida dedicata e pranzo sul Nilo.',
          pl: 'Oszczędność ponad 2 godzin na zbiórkach hotelowych w 10-osobowym minibusie, dedykowany przewodnik i obiad nad Nilem.',
          es: 'Ahorro de más de 2 horas en recogidas de hoteles con minibús de 10 plazas, guía exclusivo y almuerzo junto al Nilo.',
          uk: 'Економія до 2 годин на зборах з готелів на мікроавтобусі Mercedes Sprinter, персональний гід.'
        }
      },
      {
        id: 'opt-luxor-vip-private',
        price: 45, // +$45 = $90 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'VIP Private Tour (Private Car & Dedicated Egyptologist)',
          ru: 'VIP Индивидуальный тур (Личное авто и персональный гид)',
          de: 'VIP-Privattour (Privatwagen & eigener Ägyptologe)',
          fr: 'Visite privée VIP (Voiture privée et égyptologue dédié)',
          it: 'Tour privato VIP (Auto privata ed egittologo dedicato)',
          pl: 'Wycieczka prywatna VIP (Prywatne auto i dedykowany egiptolog)',
          es: 'Tour privado VIP (Coche privado y egiptólogo exclusivo)',
          uk: 'VIP Індивідуальний тур (Особисте авто та персональний гід)'
        },
        descriptions: {
          en: 'Exclusive private vehicle and your own private Egyptologist with flexible pacing, King Tut tomb option and Felucca sailing on the Nile.',
          ru: 'Индивидуальный автомобиль, персональный лицензированный египтолог, гибкое расписание и прогулка на фелюге по Нилу.',
          de: 'Exklusives Privatfahrzeug und eigener lizenzierter Ägyptologe mit individuellem Zeitplan und Feluken-Segeln.',
          fr: 'Véhicule privé exclusif et guide dédié avec rythme personnalisé et navigation en felouque.',
          it: 'Veicolo privato esclusivo e guida dedicata con ritmo personalizzato e navigazione in feluca sul Nilo.',
          pl: 'Prywatny samochód i licencjonowany egiptolog na wyłączność z elastycznym programem i rejsem feluką po Nilu.',
          es: 'Vehículo privado exclusivo y guía egiptólogo propio con itinerario a tu ritmo y paseo en faluca.',
          uk: 'Індивідуальний автомобіль, персональний ліцензований єгиптолог, гнучкий розклад та прогулянка на фелюзі.'
        }
      }
    ],
    duplicateSlugs: [
      'luxor-day-trip-from-hurghada',
      'luxor-valley-kings-day-trip',
      'luxor-mini-group-tour',
      'luxor-mini-group-valley-kings'
    ]
  },

  // Cluster 3: Sataya Dolphin Reef Snorkeling Yacht Expedition
  {
    clusterId: 'sataya-dolphin-reef',
    clusterName: 'Cluster 3: Sataya Dolphin Reef',
    masterSlug: 'sataya-dolphin-reef-marsa-alam',
    durationHours: 8,
    durationText: '8 Hours',
    adultPrice: 45,
    originalPrice: 65,
    options: [
      {
        id: 'opt-sataya-standard',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Standard Yacht Expedition (Hamata Departure)',
          ru: 'Стандартная яхтенная экспедиция (Выход из Хаматы)',
          de: 'Standard-Yachtexpedition (Abfahrt Hamata)',
          fr: 'Expédition standard en yacht (Départ Hamata)',
          it: 'Spedizione standard in yacht (Partenza Hamata)',
          pl: 'Standardowa wyprawa jachtem (Wypłynięcie z Hamaty)',
          es: 'Expedición estándar en yate (Salida desde Hamata)',
          uk: 'Стандартна яхтова експедиція (Вихід з Хамати)'
        },
        descriptions: {
          en: 'Yacht cruise to Sataya wild spinner dolphin lagoon, 2 guided snorkeling sessions, gear and freshly cooked buffet lunch.',
          ru: 'Круиз в лагуну диких дельфинов Сатая, 2 снорклинг-сессии с инструктором, снаряжение и обед-буфет на борту.',
          de: 'Yachtkreuzfahrt zur Sataya-Delfinlagune, 2 geführte Schnorchelgänge, Ausrüstung und frisches Mittagsbuffet.',
          fr: 'Croisière vers le récif de Sataya et ses dauphins sauvages, 2 sessions de snorkeling guidées, équipement et déjeuner.',
          it: 'Crociera in yacht alla laguna dei delfini di Sataya, 2 immersioni snorkeling con guida, attrezzatura e pranzo.',
          pl: 'Rejs jachtem do laguny dzikich delfinów Sataya, 2 sesje snorkelingu z przewodnikiem, sprzęt i świeży obiad.',
          es: 'Crucero en yate al arrecife de delfines Sataya, 2 sesiones guiadas de snorkel, equipo y almuerzo buffet.',
          uk: 'Круїз у лагуну диких дельфінів Сатая, 2 снорклінг-сесії з інструктором, спорядження та обід на борту.'
        }
      },
      {
        id: 'opt-sataya-luxury-vip',
        price: 20, // +$20 = $65 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'VIP Luxury Cruise Upgrade (Upper Lounge, Seafood Buffet)',
          ru: 'VIP Люкс-круиз (Верхняя лаунж-палуба, морепродукты)',
          de: 'VIP-Luxuskreuzfahrt (Oberdeck-Lounge, Meeresfrüchte-Buffet)',
          fr: 'Surclassement croisière VIP (Pont lounge supérieur, fruits de mer)',
          it: 'Upgrade crociera di lusso VIP (Lounge ponte superiore, frutti di mare)',
          pl: 'Pakiet luksusowy VIP (Górny pokład wypoczynkowy, owoce morza)',
          es: 'Crucero de lujo VIP (Lounge en cubierta superior, buffet de mariscos)',
          uk: 'VIP Люкс-круїз (Верхня лаунж-палуба, морепродукти)'
        },
        descriptions: {
          en: 'Premium luxury motor yacht with reserved sun-loungers, freshly grilled seafood lunch, private marine guide and Zodiac escort.',
          ru: 'Премиальная яхта с выделенными шезлонгами, обедом со свежими морепродуктами, персональным гидом и лодкой Zodiac.',
          de: 'Premium-Motoryacht mit reservierten Sonnenliegen, gegrilltem Meeresfrüchte-Mittagessen und privatem Meeresguide.',
          fr: 'Yacht à moteur haut de gamme avec transats réservés, déjeuner de fruits de mer grillés et guide privé.',
          it: 'Yacht a motore di lusso con lettini riservati, pranzo a base di frutti di mare e guida marina dedicata.',
          pl: 'Ekskluzywny jacht motorowy z leżakami, grillem z owoców morza i prywatnym przewodnikiem.',
          es: 'Yate a motor de lujo con tumbonas reservadas, almuerzo de mariscos a la parrilla y guía marino privado.',
          uk: 'Преміальна яхта з виділеними шезлонгами, обідом зі свіжими морепродуктами та персональним гідом.'
        }
      }
    ],
    duplicateSlugs: [
      'sataya-dolphin-reef-marsa-alam-luxury-cruise'
    ]
  },

  // Cluster 4A: Hurghada 3-Hour Morning Quad ATV Safari
  {
    clusterId: 'hurghada-atv-morning',
    clusterName: 'Cluster 4A: Hurghada 3-Hour Morning Quad ATV',
    masterSlug: 'desert-safari-3h-atv',
    durationHours: 3,
    durationText: '3 Hours',
    adultPrice: 18,
    originalPrice: 28,
    options: [
      {
        id: 'opt-atv-single',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Single Quad Bike (1 Rider per ATV)',
          ru: 'Одиночный квадроцикл (1 человек на квадроцикле)',
          de: 'Einzelfahrer-Quad (1 Fahrer pro ATV)',
          fr: 'Quad individuel (1 personne par quad)',
          it: 'Quad singolo (1 persona per quad)',
          pl: 'Pojedynczy quad (1 kierowca na quadzie)',
          es: 'Quad individual (1 persona por quad)',
          uk: 'Одиночний квадроцикл (1 особа на квадроциклі)'
        },
        descriptions: {
          en: 'Full 3-hour morning desert ride with your own 250cc Yamaha quad, Bedouin village stop, tea and helmet gear.',
          ru: 'Утренний 3-часовой заезд по пустыне на собственном квадроцикле 250cc, остановка в деревне бедуинов, чай и экипировка.',
          de: '3-stündige morgendliche Wüstenfahrt auf eigenem 250cc Yamaha Quad, Beduinendorf-Stopp, Tee und Ausrüstung.',
          fr: '3h d’excursion matinale en quad 250cc personnel, arrêt village bédouin, thé et équipement.',
          it: 'Escursione mattutina di 3 ore con il tuo quad 250cc, sosta al villaggio beduino, tè e casco.',
          pl: '3-godzinna poranna jazda własnym quadem 250cc, przystanek w wiosce beduińskiej, herbata i kaski.',
          es: 'Paseo matutino de 3h en tu propio quad 250cc, parada en poblado beduino, té y casco.',
          uk: 'Ранковий 3-годинний заїзд пустелею на власному квадроциклі 250cc, чаювання у бедуїнів.'
        }
      },
      {
        id: 'opt-atv-double',
        price: 10, // +$10 for double rider = $28 total for couple
        priceType: 'flat',
        enabled: true,
        labels: {
          en: 'Double Quad Bike (Driver + Passenger on 1 ATV)',
          ru: 'Двойной квадроцикл (Водитель + Пассажир на 1 квадроцикле)',
          de: 'Doppel-Quad (Fahrer + Beifahrer auf 1 ATV)',
          fr: 'Quad double (Conducteur + Passager sur 1 quad)',
          it: 'Quad doppio (Guidatore + Passeggero su 1 quad)',
          pl: 'Podwójny quad (Kierowca + Pasażer na 1 quadzie)',
          es: 'Quad doble (Conductor + Acompañante en 1 quad)',
          uk: 'Подвійний квадроцикл (Водій + Пасажир на 1 квадроциклі)'
        },
        descriptions: {
          en: 'Ride together on one comfortable 2-seater quad with shared driving permitted, Bedouin village visit and tea.',
          ru: 'Поездка вдвоем на одном комфортном двухместном квадроцикле с возможностью смены за рулем, чаепитие у бедуинов.',
          de: 'Gemeinsame Fahrt auf einem bequemen 2-Sitzer Quad mit Fahrerwechselmöglichkeit, Besuch im Beduinendorf.',
          fr: 'Balade à deux sur un quad biplace confortable, alternance au volant possible, arrêt village bédouin.',
          it: 'Guida insieme su un comodo quad biposto con possibilità di cambio alla guida, sosta e tè beduino.',
          pl: 'Wspólna jazda wygodnym dwuosobowym quadem z możliwością zamiany za kierownicą i wizytą u beduinów.',
          es: 'Paseo compartido en quad biplaza con posibilidad de turnarse al volante y parada en poblado beduino.',
          uk: 'Поїздка вдвох на одному комфортному двомісному квадроциклі з можливістю зміни водія.'
        }
      }
    ],
    duplicateSlugs: [
      'hurghada-moto-safari-quad-bikes'
    ]
  },

  // Cluster 4B: Hurghada Desert Super Safari with Bedouin Dinner & Show
  {
    clusterId: 'hurghada-super-safari',
    clusterName: 'Cluster 4B: Hurghada Desert Super Safari with Dinner & Show',
    masterSlug: 'hurghada-desert-super-safari-quad-bedouin',
    durationHours: 6,
    durationText: '6 Hours (Afternoon & Sunset)',
    adultPrice: 20,
    originalPrice: 35,
    options: [
      {
        id: 'opt-super-safari-classic',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Classic Super Safari (ATV + Buggy + Camel + BBQ & Show)',
          ru: 'Классическое Супер Сафари (Квадроцикл + Багги + Верблюд + Ужин и шоу)',
          de: 'Klassische Super Safari (Quad + Buggy + Kamel + BBQ & Show)',
          fr: 'Super Safari Classique (Quad + Buggy + Chameau + Barbecue & Spectacle)',
          it: 'Super Safari Classico (Quad + Buggy + Cammello + Cena BBQ e Spettacolo)',
          pl: 'Klasyczne Super Safari (Quad + Buggy + Wielbłąd + Kolacja z pokazem)',
          es: 'Súper Safari Clásico (Quad + Buggy + Camello + Cena barbacoa y Show)',
          uk: 'Класичне Супер Сафарі (Квадроцикл + Баггі + Верблюд + Вечеря та шоу)'
        },
        descriptions: {
          en: '45m Quad ATV + 20m Spider Buggy ride + Camel ride + Sunset photo stop + Bedouin BBQ buffet dinner + Oriental show.',
          ru: '45 мин на квадроцикле + 20 мин на багги + катание на верблюде + закатная фотосессия + ужин-барбекю и восточное шоу.',
          de: '45 Min Quad + 20 Min Buggy + Kamelritt + Sonnenuntergangs-Fotostopp + BBQ-Buffet & orientalische Tanzshow.',
          fr: '45 min de quad + 20 min de buggy + balade à dos de chameau + coucher de soleil + dîner buffet et spectacle oriental.',
          it: '45 min di quad + 20 min di buggy + giro in cammello + tramonto + cena barbecue a buffet e spettacolo orientale.',
          pl: '45 min quadem + 20 min buggy + przejażdżka na wielbłądzie + zachód słońca + kolacja w formie bufetu i pokaz orientalny.',
          es: '45 min de quad + 20 min de buggy + paseo en camello + puesta de sol + cena barbacoa y espectáculo oriental.',
          uk: '45 хв на квадроциклі + 20 хв на баггі + катання на верблюді + захід сонця + вечеря-барбекю та східне шоу.'
        }
      },
      {
        id: 'opt-super-safari-mega',
        price: 8, // +$8 = $28 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Mega Safari (Extended Ride & Telescope Stargazing)',
          ru: 'Мега Сафари (Удвоенное катание и телескоп)',
          de: 'Mega Safari (Verlängerte Fahrt & Teleskop-Sternbeobachtung)',
          fr: 'Méga Safari (Parcours prolongé et observation aux télescopes)',
          it: 'Mega Safari (Percorso prolungato e osservazione astronomica)',
          pl: 'Mega Safari (Przedłużona jazda i obserwacja gwiazd przez teleskop)',
          es: 'Mega Safari (Recorrido extendido y observación con telescopio)',
          uk: 'Мега Сафарі (Подовжене катання та телескоп)'
        },
        descriptions: {
          en: 'Double time on quad & dune buggy tracks, plus high-powered digital telescope astronomy session in the pitch-black desert.',
          ru: 'Двойное время катания на квадроциклах и багги, плюс астрономическое наблюдение за звездами и планетами через мощный телескоп.',
          de: 'Doppelte Fahrzeit auf Quad & Buggy plus astronomische Himmelsbeobachtung mit Hochleistungsteleskop in der Wüste.',
          fr: 'Temps de conduite doublé en quad et buggy, plus séance d’astronomie avec télescope haute puissance dans le désert.',
          it: 'Tempo raddoppiato su quad e buggy, più sessione astronomica con telescopio ad alta potenza nel deserto buio.',
          pl: 'Podwójny czas jazdy quadem i buggy oraz profesjonalna obserwacja gwiazd przez teleskop na pustyni.',
          es: 'Doble de tiempo en quad y buggy más sesión de astronomía con telescopio de alta potencia en el desierto.',
          uk: 'Подвійний час катання на квадроциклах і баггі, плюс астрономічне спостереження за зірками через телескоп.'
        }
      },
      {
        id: 'opt-super-safari-royal',
        price: 15, // +$15 = $35 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Royal VIP Safari (Private Guide & Reserved Front-Row Dinner)',
          ru: 'Королевское VIP Сафари (Личный гид и места в первом ряду)',
          de: 'Königliche VIP Safari (Eigener Guide & reservierte Plätze)',
          fr: 'Safari Royal VIP (Guide privé et dîner VIP aux premières loges)',
          it: 'Royal VIP Safari (Guida privata e cena riservata in prima fila)',
          pl: 'Królewskie VIP Safari (Prywatny przewodnik i miejsca w pierwszym rzędzie)',
          es: 'Safari Real VIP (Guía privado y cena reservada en primera fila)',
          uk: 'Королівське VIP Сафарі (Особистий гід та місця в першому ряду)'
        },
        descriptions: {
          en: 'Private luxury transfer, dedicated private desert guide leading your convoy, VIP front-row seating at the show and premium shisha included.',
          ru: 'Индивидуальный трансфер, отдельный персональный гид во главе вашей колонны, лучшие места у сцены и кальян в подарок.',
          de: 'Privater Transfer, eigener Wüstenguide für Ihren Konvoi, VIP-Sitzplätze in der ersten Reihe bei der Show und Premium-Shisha.',
          fr: 'Transfert privé, guide dédié en tête de votre convoi, places VIP au premier rang et chicha premium offerte.',
          it: 'Trasferimento privato, guida esclusiva in testa al convoglio, posti VIP in prima fila allo spettacolo e narghilè incluso.',
          pl: 'Prywatny transfer, dedykowany przewodnik na czele kolumny, miejsca VIP w pierwszym rzędzie i fajka wodna w cenie.',
          es: 'Traslado privado, guía exclusivo al frente de tu convoy, asientos VIP en primera fila y shisha premium.',
          uk: 'Індивідуальний трансфер, окремий персональний гід, найкращі місця біля сцени та кальян.'
        }
      }
    ],
    duplicateSlugs: [
      'desert-safari-3h-dinner-show',
      'super-safari-hurghada',
      'hurghada-mega-safari-quad-buggy-bedouin-dinner',
      'royal-safari-hurghada'
    ]
  },

  // Cluster 5: Giftun Island (Orange Bay Island Boat Trip & Snorkeling)
  {
    clusterId: 'orange-bay-giftun',
    clusterName: 'Cluster 5: Giftun Island Orange Bay Cruise',
    masterSlug: 'orange-bay-giftun-island-day',
    durationHours: 8,
    durationText: '8 Hours',
    adultPrice: 23,
    originalPrice: 35,
    options: [
      {
        id: 'opt-orange-bay-classic',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Classic Island Cruise (2h Beach + 2 Snorkel Stops + Lunch)',
          ru: 'Классический круиз на Оранж Бей (2ч на пляже + 2 снорклинга + обед)',
          de: 'Klassische Insel-Kreuzfahrt (2h Strand + 2 Schnorchelstopps + Mittagessen)',
          fr: 'Croisière classique Orange Bay (2h de plage + 2 arrêts snorkeling + déjeuner)',
          it: 'Crociera classica a Orange Bay (2h spiaggia + 2 soste snorkeling + pranzo)',
          pl: 'Klasyczny rejs na Orange Bay (2h na plaży + 2 postoje na snorkeling + obiad)',
          es: 'Crucero clásico Orange Bay (2h en playa + 2 paradas de snorkel + almuerzo)',
          uk: 'Класичний круїз на Оранж Бей (2г на пляжі + 2 снорклінги + обід)'
        },
        descriptions: {
          en: 'Cruise from Hurghada marina, 2 hours on Orange Bay white sands, 2 guided coral reef snorkeling stops, open buffet lunch and water sports banana boat.',
          ru: 'Выход из марины Хургады, 2 часа на белом песке острова Оранж Бей, 2 остановки на рифах, обед-буфет и катание на банане.',
          de: 'Bootsfahrt ab Hurghada Marina, 2 Stunden auf Orange Bay, 2 geführte Schnorchelgänge an Korallenriffen, Mittagsbuffet und Bananaboot.',
          fr: 'Départ de la marina de Hurghada, 2h sur la plage d’Orange Bay, 2 arrêts snorkeling guidés, déjeuner buffet et bouée tractée.',
          it: 'Partenza dalla marina di Hurghada, 2 ore sulla spiaggia di sabbia bianca, 2 tappe snorkeling, pranzo a buffet e banana boat.',
          pl: 'Rejs z mariny w Hurghadzie, 2 godziny na plaży Orange Bay, 2 postoje na rafie, obiad w formie bufetu i zabawa na bananie.',
          es: 'Salida desde la marina de Hurghada, 2 horas en Orange Bay, 2 sesiones guiadas de snorkel, almuerzo buffet y banana acuática.',
          uk: 'Вихід з марини Хургади, 2 години на пляжі Оранж Бей, 2 зупинки на рифах, обід-буфет та катання на банані.'
        }
      },
      {
        id: 'opt-orange-bay-vip-yacht',
        price: 12, // +$12 = $35 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'VIP Luxury Yacht Cruise (Spacious 3-Deck Yacht & Seafood)',
          ru: 'VIP Люкс-яхта (3-палубная яхта, морепродукты и комфорт)',
          de: 'VIP-Luxusyacht (Geräumige 3-Deck-Yacht & Meeresfrüchte)',
          fr: 'Croisière VIP sur yacht de luxe (Yacht à 3 ponts et fruits de mer)',
          it: 'Crociera VIP su yacht di lusso (Yacht a 3 ponti e frutti di mare)',
          pl: 'Luksusowy jacht VIP (Przestronny jacht 3-pokładowy i owoce morza)',
          es: 'Yate de lujo VIP (Yate de 3 cubiertas y mariscos)',
          uk: 'VIP Люкс-яхта (3-палубна яхта, морепродукти та комфорт)'
        },
        descriptions: {
          en: 'Sail on an upgraded 3-deck luxury yacht with maximum 25 guests, freshly prepared seafood lunch, sun-beds and dedicated marine snorkel guide.',
          ru: 'Круиз на роскошной 3-палубной яхте с ограничением до 25 гостей, обедом из свежих морепродуктов, мягкими шезлонгами и гидом.',
          de: 'Segeln Sie auf einer luxuriösen 3-Deck-Yacht mit maximal 25 Gästen, frischem Meeresfrüchte-Mittagessen und reservierten Sonnenbetten.',
          fr: 'Navigation sur yacht de luxe à 3 ponts (max 25 personnes), déjeuner de fruits de mer frais, bains de soleil et guide dédié.',
          it: 'Navigazione su yacht di lusso a 3 ponti con massimo 25 ospiti, pranzo a base di frutti di mare e lettini prendisole.',
          pl: 'Rejs 3-pokładowym luksusowym jachtem dla maksymalnie 25 osób, świeży obiad z owocami morza i dedykowany przewodnik.',
          es: 'Navega en un yate de lujo de 3 cubiertas con un máximo de 25 invitados, almuerzo de mariscos y tumbonas exclusivas.',
          uk: 'Круїз на розкішній 3-палубній яхті з обмеженням до 25 гостей, обідом зі свіжих морепродуктів та мʼякими шезлонгами.'
        }
      }
    ],
    duplicateSlugs: [
      'giftun-island-orange-bay-luxury-cruise',
      'orange-bay-island-hurghada'
    ]
  },

  // Cluster 6: Ras Mohamed & White Island Luxury Yacht Cruise
  {
    clusterId: 'ras-mohamed-white-island',
    clusterName: 'Cluster 6: Ras Mohamed & White Island',
    masterSlug: 'ras-mohamed-white-island-luxury-cruise',
    durationHours: 7,
    durationText: '7 Hours',
    adultPrice: 38,
    originalPrice: 55,
    options: [
      {
        id: 'opt-ras-mohamed-snorkel',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Snorkeling Cruise & White Island Sandbar Access',
          ru: 'Снорклинг-круиз и высадка на Белый Остров',
          de: 'Schnorchelkruise & Landgang auf der Weißen Insel',
          fr: 'Croisière snorkeling et escale sur l’Île Blanche',
          it: 'Crociera snorkeling ed escursione all’Isola Bianca',
          pl: 'Rejs na snorkeling i pobyt na Białej Wyspie',
          es: 'Crucero de snorkel y visita al banco de arena Isla Blanca',
          uk: 'Снорклінг-круїз та висадка на Білий Острів'
        },
        descriptions: {
          en: 'Yacht cruise from Sharm El Sheikh to Ras Mohamed National Park, 2 guided snorkeling stops at pristine drop-off reefs, White Island sandbar walk and BBQ lunch.',
          ru: 'Круиз из Шарм-эль-Шейха в заповедник Рас Мохаммед, 2 снорклинга на коралловых стенах, отдых на песчаной косе Белого Острова и обед-барбекю.',
          de: 'Yachtkreuzfahrt ab Sharm El Sheikh zum Ras Mohamed Nationalpark, 2 geführte Schnorchelgänge an spektakulären Steilwänden, Inselgang und BBQ.',
          fr: 'Croisière depuis Charm el-Cheikh vers Ras Mohamed, 2 arrêts snorkeling le long des récifs coralliens, arrêt sur l’Île Blanche et buffet BBQ.',
          it: 'Crociera in yacht da Sharm El Sheikh a Ras Mohamed, 2 immersioni snorkeling con guida su barriere coralline, sabbia dell’Isola Bianca e pranzo BBQ.',
          pl: 'Rejs jachtem z Sharm El Sheikh do Parku Narodowego Ras Mohamed, 2 postoje na rafie, spacer po Białej Wyspie i grillowany obiad.',
          es: 'Crucero en yate desde Sharm El Sheikh a Ras Mohamed, 2 paradas guiadas de snorkel en arrecifes, paseo por Isla Blanca y almuerzo barbacoa.',
          uk: 'Круїз із Шарм-ель-Шейха в заповідник Рас Мохаммед, 2 снорклінги на коралових стінах, відпочинок на Білому Острові.'
        }
      },
      {
        id: 'opt-ras-mohamed-dive-1',
        price: 12, // +$12 = $50 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Cruise with 1 Guided Scuba Dive (Beginners or Certified)',
          ru: 'Круиз с 1 ознакомительным погружением с аквалангом',
          de: 'Kreuzfahrt mit 1 geführten Tauchgang (Anfänger & Profis)',
          fr: 'Croisière avec 1 baptême de plongée sous-marine',
          it: 'Crociera con 1 immersione subacquea guidata',
          pl: 'Rejs z 1 nurkowaniem z instruktorem (Dla początkujących)',
          es: 'Crucero con 1 inmersión de buceo guiada',
          uk: 'Круїз з 1 ознайомчим зануренням з аквалангом'
        },
        descriptions: {
          en: 'Includes everything in the cruise plus 1 guided 20-minute dive with a PADI instructor (depth up to 8m, no license needed) with full dive equipment.',
          ru: 'Включает программу круиза плюс 1 персональное погружение на 20 мин с инструктором PADI на глубину до 8м без сертификата, полное снаряжение.',
          de: 'Beinhaltet die komplette Kreuzfahrt plus 1 geführten 20-minütigen Tauchgang mit PADI-Tauchlehrer (bis zu 8m Tiefe) inklusive kompletter Ausrüstung.',
          fr: 'Comprend la croisière complète plus 1 plongée de 20 min avec moniteur PADI certifié (jusqu’à 8m sans diplôme requis) et matériel complet.',
          it: 'Include l’intera crociera più 1 immersione guidata di 20 minuti con istruttore PADI (fino a 8 metri, brevetto non richiesto) ed equipaggiamento.',
          pl: 'Zawiera pełny rejs oraz 1 nurkowanie 20-minutowe z instruktorem PADI (do 8 m głębokości, bez certyfikatu) i kompletny sprzęt.',
          es: 'Incluye todo el crucero más 1 inmersión guiada de 20 minutos con instructor PADI (hasta 8 m, sin titulación previa) y equipo completo.',
          uk: 'Включає програму круїзу плюс 1 персональне занурення на 20 хв з інструктором PADI на глибину до 8м.'
        }
      },
      {
        id: 'opt-ras-mohamed-dive-2',
        price: 24, // +$24 = $62 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Cruise with 2 Guided Scuba Dives at Different Reefs',
          ru: 'Круиз с 2 погружениями с аквалангом на разных рифах',
          de: 'Kreuzfahrt mit 2 geführten Tauchgängen an verschiedenen Riffen',
          fr: 'Croisière avec 2 plongées sous-marines sur des récifs distincts',
          it: 'Crociera con 2 immersioni subacquee su barriere diverse',
          pl: 'Rejs z 2 nurkowaniami z akwalungiem na różnych rafach',
          es: 'Crucero con 2 inmersiones de buceo en arrecifes diferentes',
          uk: 'Круїз з 2 зануреннями з аквалангом на різних рифах'
        },
        descriptions: {
          en: 'Includes 2 separate scuba dives at premier Ras Mohamed sites with certified instructor and full gear.',
          ru: '2 отдельных погружения на лучших коралловых спотах Рас Мохаммеда с персональным инструктором и экипировкой.',
          de: '2 separate Tauchgänge an erstklassigen Riffen in Ras Mohamed mit Tauchlehrer und vollständiger Ausrüstung.',
          fr: '2 plongées distinctes sur les plus beaux sites de Ras Mohamed avec moniteur et équipement complet.',
          it: '2 immersioni separate nei migliori punti di Ras Mohamed con istruttore e attrezzatura completa.',
          pl: '2 oddzielne nurkowania w najlepszych miejscach Ras Mohamed z instruktorem i pełnym osprzętem.',
          es: '2 inmersiones independientes en los mejores puntos de Ras Mohamed con instructor y equipo completo.',
          uk: '2 окремі занурення на найкращих коралових спотах Рас Мохаммеда з персональним інструктором.'
        }
      }
    ],
    duplicateSlugs: [
      'ras-mohamed-white-island-luxury-yacht-sharm',
      'scuba-diving-white-island-ras-mohamed'
    ]
  },

  // Cluster 7: Mount Sinai Sunrise Trek & St. Catherine Monastery
  {
    clusterId: 'mount-sinai-sunrise',
    clusterName: 'Cluster 7: Mount Sinai Sunrise Trek',
    masterSlug: 'mount-sinai-sunrise-st-catherine-monastery-tour',
    durationHours: 14,
    durationText: '14 Hours (Overnight Trek)',
    adultPrice: 42,
    originalPrice: 60,
    options: [
      {
        id: 'opt-sinai-standard-hike',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Standard Mountain Trek (Bedouin Guide & Monastery Visit)',
          ru: 'Стандартный пеший подъем (Бедуинский проводник и монастырь)',
          de: 'Standard-Bergtour (Beduinenguide & Klosterbesuch)',
          fr: 'Ascension pédestre standard (Guide bédouin et monastère)',
          it: 'Trekking standard (Guida beduina e visita al monastero)',
          pl: 'Standardowe wejście piesze (Przewodnik beduiński i klasztor)',
          es: 'Ascenso a pie estándar (Guía beduino y visita al monasterio)',
          uk: 'Стандартний піший підйом (Бедуїнський провідник та монастир)'
        },
        descriptions: {
          en: 'Night bus transfer from Sharm, guided summit hike up Mount Sinai (2,285m) for sunrise, and morning guided tour of historic St. Catherine Monastery.',
          ru: 'Ночной трансфер из Шарм-эль-Шейха, подъем на гору Моисея (2285 м) к рассвету с бедуинским проводником и утренняя экскурсия по монастырю св. Екатерины.',
          de: 'Nachtfahrt ab Sharm, geführte Gipfelwanderung auf den Berg Sinai (2.285 m) zum Sonnenaufgang und Führung im Katharinenkloster.',
          fr: 'Transfert de nuit depuis Charm, randonnée au sommet du Mont Sinaï (2 285 m) pour le lever du soleil et visite du monastère Sainte-Catherine.',
          it: 'Transfer notturno da Sharm, ascesa guidata sul Monte Sinai (2.285 m) per l’alba e visita guidata al Monastero di Santa Caterina.',
          pl: 'Nocny transfer z Sharm, wejście z przewodnikiem na Górę Synaj (2285 m n.p.m.) na wschód słońca oraz zwiedzanie Klasztoru św. Katarzyny.',
          es: 'Traslado nocturno desde Sharm, ascenso guiado al Monte Sinaí (2.285 m) para ver amanecer y visita guiada al Monasterio de Santa Catalina.',
          uk: 'Нічний трансфер із Шарм-ель-Шейха, підйом на гору Мойсея (2285 м) до сходу сонця та екскурсія по монастирю св. Катерини.'
        }
      },
      {
        id: 'opt-sinai-camel-assist',
        price: 23, // +$23 = $65 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Trek with Camel Ride Support (Ride up to peak steps)',
          ru: 'Подъем с поддержкой верблюда (Поездка до ступеней вершины)',
          de: 'Wanderung mit Kamelunterstützung (Ritt bis zu den Stufen)',
          fr: 'Ascension avec assistance à dos de chameau (Jusqu’aux marches)',
          it: 'Trekking con supporto in cammello (Corsa fino ai gradini della cima)',
          pl: 'Wejście z pomocą wielbłąda (Podjazd do schodów szczytowych)',
          es: 'Ascenso con apoyo de camello (Paseo hasta los escalones de la cima)',
          uk: 'Підйом з підтримкою верблюда (Поїздка до сходинок вершини)'
        },
        descriptions: {
          en: 'Save your energy on the 7km mountain incline with a dedicated Bedouin camel riding up to Elijah’s Basin (steps base), then complete the final 750 summit steps on foot.',
          ru: 'Берегите силы на 7-километровом подъеме: поездка на верблюде до подножия финальных ступеней, затем подъем по лестнице на вершину пешком.',
          de: 'Schonen Sie Ihre Kräfte auf dem 7 km langen Anstieg mit einem Kamel bis zur Stufenbasis und steigen Sie die letzten 750 Stufen zu Fuß auf.',
          fr: 'Épargnez vos forces sur les 7 km de montée grâce à une montée à dos de chameau jusqu’aux marches, puis finissez les 750 marches à pied.',
          it: 'Risparmia le forze sui 7 km di salita salendo a dorso di cammello fino alla base dei gradini, poi affronta gli ultimi 750 gradini a piedi.',
          pl: 'Zaoszczędź siły na 7-kilometrowym podejściu dzięki wjazdowi na wielbłądzie pod schody i pokonaj ostatnie 750 stopni pieszo.',
          es: 'Ahorra energía en la subida de 7 km montando en camello hasta la base de las escaleras y sube los últimos 750 escalones a pie.',
          uk: 'Бережіть сили на 7-кілометровому підйомі: поїздка на верблюді до підніжжя фінальних сходинок.'
        }
      }
    ],
    duplicateSlugs: [
      'mount-moses-st-catherine-sunrise-hike'
    ]
  },

  // Cluster 8: Abu Dabbab Bay Sea Turtles & Dugong Snorkeling
  {
    clusterId: 'abu-dabbab-bay',
    clusterName: 'Cluster 8: Abu Dabbab Bay Sea Turtles & Dugong',
    masterSlug: 'abu-dabbab-bay-turtles-dugong-snorkeling',
    durationHours: 6,
    durationText: '6 Hours',
    adultPrice: 35,
    originalPrice: 48,
    options: [
      {
        id: 'opt-dabbab-shore',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Shore Snorkeling Day Pass (Beach Entry, Guide & Lunch)',
          ru: 'Снорклинг с берега (Вход на пляж, гид и обед)',
          de: 'Tagespass Uferschnorcheln (Strandeintritt, Guide & Lunch)',
          fr: 'Pass journée snorkeling depuis la plage (Accès, guide & déjeuner)',
          it: 'Pass giornaliero snorkeling da riva (Spiaggia, guida e pranzo)',
          pl: 'Dzienny bilet na snorkeling z brzegu (Wstęp, przewodnik i obiad)',
          es: 'Pase de día de snorkel desde la orilla (Entrada, guía y almuerzo)',
          uk: 'Снорклінг з берега (Вхід на пляж, гід та обід)'
        },
        descriptions: {
          en: 'Transfers from Marsa Alam, entrance to protected Abu Dabbab beach, guided snorkeling search for giant green sea turtles and sea-cows, lunch and sunbeds.',
          ru: 'Трансфер из отелей Марса Алам, вход на охраняемый пляж Абу Даббаб, снорклинг с гидом в поисках гигантских черепах и дюгоня, шезлонги и обед.',
          de: 'Hoteltransfer ab Marsa Alam, Eintritt zum geschützten Strand Abu Dabbab, geführtes Schnorcheln mit Riesenschildkröten und Seekühen, Liegen und Mittagessen.',
          fr: 'Transfert depuis Marsa Alam, entrée à la plage protégée d’Abu Dabbab, snorkeling guidé avec tortues vertes géantes et dugong, transats et repas.',
          it: 'Transfer da Marsa Alam, ingresso alla spiaggia protetta di Abu Dabbab, snorkeling guidato con tartarughe marine giganti e dugongo, lettini e pranzo.',
          pl: 'Transfer z Marsa Alam, wstęp na chronioną plażę Abu Dabbab, snorkeling z przewodnikiem w poszukiwaniu wielkich żółwi i krów morskich, leżaki i obiad.',
          es: 'Traslado desde Marsa Alam, entrada a la playa protegida de Abu Dabbab, snorkel guiado para ver tortugas marinas gigantes y manatíes, tumbonas y almuerzo.',
          uk: 'Трансфер з готелів Марса Алам, вхід на пляж Абу Даббаб, снорклінг з гідом у пошуках гігантських черепах і дюгоня.'
        }
      },
      {
        id: 'opt-dabbab-speedboat',
        price: 17, // +$17 = $52 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Speedboat Safari to Outer Reefs & Dugong Hotspots',
          ru: 'Сафари на скоростном катере к внешним рифам и местам дюгоня',
          de: 'Speedboot-Safari zu Außenriffen & Seekuh-Spots',
          fr: 'Safari en hors-bord vers les récifs extérieurs et zones à dugong',
          it: 'Safari in motoscafo verso i reef esterni e le zone dei dugonghi',
          pl: 'Safari motorówką na zewnętrzne rafy i żerowiska krów morskich',
          es: 'Safari en lancha rápida a los arrecifes exteriores y zona de manatíes',
          uk: 'Сафарі на швидкісному катері до зовнішніх рифів та місць дюгоня'
        },
        descriptions: {
          en: 'Add a 90-minute fast speedboat adventure to outer pristine reefs where dugongs and guitar rays feed in deeper clear water.',
          ru: 'Дополнительный 90-минутный заезд на скоростном катере к диким внешним рифам, где дюгони и скаты-гитары кормятся на глубине.',
          de: 'Zusätzliches 90-minütiges Speedboot-Abenteuer zu vorgelagerten Riffen, wo Seekühe und Gitarrenrochen im klaren Tiefwasser weiden.',
          fr: 'Aventure supplémentaire de 90 minutes en hors-bord vers les récifs intacts du large où s’alimentent dugongs et raies guitares.',
          it: 'Aggiunge 90 minuti di avventura in motoscafo veloce verso i reef esterni incontaminati, habitat di dugonghi e razze chitarra.',
          pl: 'Dodatkowa 90-minutowa wyprawa szybką łodzią motorową na dziewicze zewnętrzne rafy, gdzie żerują krowy morskie i płaszczki.',
          es: 'Añade 90 minutos de aventura en lancha rápida a los arrecifes exteriores vírgenes donde se alimentan manatíes y peces guitarra.',
          uk: 'Додатковий 90-хвилинний заїзд на швидкісному катері до диких зовнішніх рифів.'
        }
      }
    ],
    duplicateSlugs: [
      'abu-dabbab-sea-turtle-dugong-bay-snorkeling'
    ]
  },

  // Cluster 9: Hurghada Luxury Hammam & Traditional Spa Rituals
  {
    clusterId: 'hurghada-spa-hammam',
    clusterName: 'Cluster 9: Hurghada Spa & Hammam Rituals',
    masterSlug: 'spa-body-massage-1h-hurghada',
    durationHours: 3,
    durationText: '2-3 Hours',
    adultPrice: 17,
    originalPrice: 28,
    options: [
      {
        id: 'opt-spa-massage-60',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Full Body Relaxation Massage (60 min) with Sauna & Jacuzzi',
          ru: 'Расслабляющий массаж всего тела (60 мин) с сауной и джакузи',
          de: 'Ganzkörper-Entspannungsmassage (60 Min.) mit Sauna & Whirlpool',
          fr: 'Massage relaxant complet du corps (60 min) avec sauna & jacuzzi',
          it: 'Massaggio rilassante corpo completo (60 min) con sauna e idromassaggio',
          pl: 'Relaksacyjny masaż całego ciała (60 min) z sauną i jacuzzi',
          es: 'Masaje relajante corporal completo (60 min) con sauna y jacuzzi',
          uk: 'Розслабляючий масаж усього тіла (60 хв) із сауною та джакузі'
        },
        descriptions: {
          en: 'Therapeutic 60-minute full body massage using aromatic Egyptian oils, preceded by free access to sauna, steam room and jacuzzi.',
          ru: 'Лечебный 60-минутный массаж с натуральными ароматическими маслами, предварительный разогрев в сауне, парной и джакузи.',
          de: 'Therapeutische 60-minütige Ganzkörpermassage mit aromatischen ägyptischen Ölen nach Besuch von Sauna, Dampfbad und Whirlpool.',
          fr: 'Massage thérapeutique de 60 minutes aux huiles essentielles égyptiennes, précédé d’un accès au sauna, hammam et jacuzzi.',
          it: 'Massaggio terapeutico di 60 minuti con oli aromatici egiziani, preceduto da sauna, bagno turco e idromassaggio.',
          pl: 'Terapeutyczny 60-minutowy masaż z aromatycznymi olejkami egipskimi oraz dostęp do sauny, łaźni parowej i jacuzzi.',
          es: 'Masaje terapéutico de 60 minutos con aceites aromáticos egipcios, precedido de acceso a sauna, baño de vapor y jacuzzi.',
          uk: 'Лікувальний 60-хвилинний масаж з натуральними ароматичними оліями, сауна та джакузі.'
        }
      },
      {
        id: 'opt-spa-turkish-hammam',
        price: 3, // +$3 = $20 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Traditional Turkish Hammam & Peeling Scrub + 50-Min Body Massage',
          ru: 'Традиционный турецкий хаммам с пенным пилингом + 50 мин массажа',
          de: 'Traditionelles türkisches Hammam & Peeling + 50 Min. Massage',
          fr: 'Hammam turc traditionnel avec gommage + 50 min de massage',
          it: 'Hammam turco tradizionale e scrub esfoliante + 50 min di massaggio',
          pl: 'Tradycyjny turecki hammam z peelingiem pianowym + 50 min masażu',
          es: 'Hammam turco tradicional con exfoliación de espuma + 50 min de masaje',
          uk: 'Традиційний турецький хамам з пінним пілінгом + 50 хв масажу'
        },
        descriptions: {
          en: 'Warm marble slab peeling with Kessa glove, fragrant olive soap foam wash, followed by full 50-minute oil massage and hot tea.',
          ru: 'Пилинг перчаткой Кесе на теплом мраморе, омовение ароматной мыльной пеной из оливкового мыла и полный 50-минутный массаж.',
          de: 'Peeling mit Kessa-Handschuh auf warmem Marmor, Schaumwaschung mit Olivenölseife und anschließende 50-minütige Massage.',
          fr: 'Gommage au gant Kessa sur marbre chaud, rituel moussant au savon d’olive suivi d’un massage relaxant de 50 minutes.',
          it: 'Scrub con guanto Kessa su marmo riscaldato, lavaggio con schiuma di sapone d’oliva e 50 minuti di massaggio completo.',
          pl: 'Peeling rękawicą Kessa na ciepłym marmurze, kąpiel w pianie z mydła oliwkowego i 50-minutowy masaż relaksacyjny.',
          es: 'Exfoliación con guante Kessa en mármol caliente, baño de espuma con jabón de oliva y masaje corporal de 50 minutos.',
          uk: 'Пілінг рукавицею Кесе на теплому мармурі, омивання піною з оливкового мила та 50-хвилинний масаж.'
        }
      },
      {
        id: 'opt-spa-cleopatra-ritual',
        price: 8, // +$8 = $25 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Royal Cleopatra Ritual (Coconut Body Scrub + Gold Facial Mask + 45-Min Massage)',
          ru: 'Королевский ритуал Клеопатра (Кокосовый пилинг + Золотая маска + 45 мин массажа)',
          de: 'Königliches Kleopatra-Ritual (Kokos-Peeling + Gold-Gesichtsmaske + 45 Min. Massage)',
          fr: 'Rituel Royal Cléopâtre (Gommage à la noix de coco + Masque doré + 45 min de massage)',
          it: 'Rituale Reale di Cleopatra (Scrub cocco + Maschera viso all’oro + 45 min massaggio)',
          pl: 'Królewski rytuał Kleopatry (Peeling kokosowy + Złota maska + 45 min masażu)',
          es: 'Ritual Real de Cleopatra (Exfoliación de coco + Mascarilla facial de oro + 45 min masaje)',
          uk: 'Королівський ритуал Клеопатра (Кокосовий пілінг + Золота маска + 45 хв масажу)'
        },
        descriptions: {
          en: 'All-inclusive luxury rejuvenation: sweet coconut full-body scrub, 24K gold glowing facial mask, steam bath and 45-minute relaxation massage.',
          ru: 'Роскошное омоложение: кокосовый скраб всего тела, золотая маска для лица 24K, парная и 45 минут расслабляющего массажа.',
          de: 'Exklusives Verwöhnprogramm: Süßes Kokosnuss-Körperpeeling, 24K Gold-Gesichtsmaske, Dampfbad und 45 Minuten Entspannungsmassage.',
          fr: 'Soin de luxe complet: gommage corps à la noix de coco, masque éclat à l’or 24 carats, bain de vapeur et massage de 45 minutes.',
          it: 'Trattamento esclusivo di bellezza: scrub al cocco, maschera viso rigenerante all’oro 24 carati, bagno di vapore e 45 min di massaggio.',
          pl: 'Luksusowa regeneracja: słodki peeling kokosowy, rozświetlająca maska ze złota 24K, łaźnia i 45 minut masażu.',
          es: 'Regeneración de lujo completa: exfoliación corporal de coco dulce, mascarilla facial de oro de 24K, baño de vapor y 45 min de masaje.',
          uk: 'Розкішне омолодження: кокосовий скраб усього тіла, золота маска для обличчя 24K, парна та 45 хвилин масажу.'
        }
      },
      {
        id: 'opt-spa-moroccan-bath',
        price: 8, // +$8 = $25 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Authentic Moroccan Bath (Beldi Black Soap + Eucalyptus Steam + 50-Min Massage)',
          ru: 'Аутентичный марокканский хаммам (Черное мыло бельди + Эвкалипт + 50 мин массажа)',
          de: 'Authentisches marokkanisches Bad (Schwarze Beldi-Seife + Eukalyptus-Dampf + 50 Min. Massage)',
          fr: 'Bain marocain authentique (Savon noir Beldi + Vapeur à l’eucalyptus + 50 min de massage)',
          it: 'Autentico bagno marocchino (Sapone nero Beldi + Vapore all’eucalipto + 50 min di massaggio)',
          pl: 'Autentyczna łaźnia marokańska (Czarne mydło Beldi + Eukaliptus + 50 min masażu)',
          es: 'Auténtico baño marroquí (Jabón negro Beldi + Vapor de eucalipto + 50 min de masaje)',
          uk: 'Автентичний марокканський хамам (Чорне мило бельді + Евкаліпт + 50 хв масажу)'
        },
        descriptions: {
          en: 'Deep purifying Moroccan detox: Beldi black olive soap application, eucalyptus steam room session, vigorous Kessa exfoliation and 50-minute argan oil massage.',
          ru: 'Глубокий марокканский детокс: нанесение черного оливкового мыла Бельди, эвкалиптовая парная, интенсивный пилинг и 50 минут массажа с аргановым маслом.',
          de: 'Tiefenreinigendes Detox-Ritual: Schwarze Olivenölseife Beldi, Eukalyptus-Dampfbad, intensives Kessa-Peeling und 50 Minuten Arganöl-Massage.',
          fr: 'Détoxification profonde: savon noir à l’huile d’olive, hammam à l’eucalyptus, gommage Kessa et 50 minutes de massage à l’huile d’argan.',
          it: 'Detox profondo: sapone nero alle olive Beldi, vapore all’eucalipto, scrub vigoroso con guanto Kessa e 50 minuti di massaggio con olio di argan.',
          pl: 'Głęboki detoks marokański: czarne mydło z oliwek Beldi, łaźnia eukaliptusowa, mocny peeling Kessa i 50 minut masażu olejkiem arganowym.',
          es: 'Desintoxicación profunda: jabón negro Beldi, baño de vapor con eucalipto, exfoliación Kessa y 50 minutos de masaje con aceite de argán.',
          uk: 'Глибокий марокканський детокс: чорне оливкове мило Бельді, евкаліптова парна, інтенсивний пілінг та 50 хвилин масажу з олією аргани.'
        }
      }
    ],
    duplicateSlugs: [
      'spa-turkish-bath-massage-hurghada',
      'spa-cleopatra-bath-massage-hurghada',
      'spa-moroccan-bath-massage-hurghada'
    ]
  },

  // Cluster 10: Hurghada Dolphin World Experiences
  {
    clusterId: 'hurghada-dolphin-world',
    clusterName: 'Cluster 10: Hurghada Dolphin World',
    masterSlug: 'dolphinarium-show-hurghada',
    durationHours: 2,
    durationText: '2 Hours',
    adultPrice: 15,
    originalPrice: 25,
    options: [
      {
        id: 'opt-dolphin-show-ticket',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Live Dolphin & Sea Lion Show Admission Ticket',
          ru: 'Входной билет на шоу дельфинов и морских львов',
          de: 'Eintrittskarte für die Delfin- & Seelöwenshow',
          fr: 'Billet d’entrée pour le spectacle de dauphins et d’otaries',
          it: 'Biglietto d’ingresso allo spettacolo di delfini e leoni marini',
          pl: 'Bilet wstępu na pokaz delfinów i lwów morskich',
          es: 'Entrada para el espectáculo de delfines y leones marinos',
          uk: 'Вхідний квиток на шоу дельфінів та морських левів'
        },
        descriptions: {
          en: 'Spectacular 1-hour live performance of dolphins, walruses and sea lions in Makadi Bay with hotel round-trip transfers included.',
          ru: 'Зрелищное 1-часовое представление дельфинов, моржей и морских котиков в Макади Бей с трансфером из отеля и обратно.',
          de: 'Spektakuläre 1-stündige Live-Show mit Delfinen, Walrossen und Seelöwen in der Makadi Bay inklusive Hoteltransfers.',
          fr: 'Spectacle captivant d’une heure avec dauphins, morses et otaries à Makadi Bay, transferts aller-retour inclus.',
          it: 'Spettacolo dal vivo di 1 ora con delfini, trichechi e leoni marini a Makadi Bay, transfer A/R inclusi.',
          pl: 'Widowiskowy godzinny pokaz delfinów, morsów i lwów morskich w Makadi Bay z transferem w obie strony.',
          es: 'Espectáculo en vivo de 1 hora con delfines, morsas y leones marinos en Makadi Bay, traslados incluidos.',
          uk: 'Видовищне 1-годинне шоу дельфінів, моржів та морських котиків у Макаді Бей з трансфером.'
        }
      },
      {
        id: 'opt-dolphin-photo-session',
        price: 23, // +$23 = $38 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Show Ticket + Professional Printed Photo Session with Dolphins',
          ru: 'Шоу + Профессиональная фотосессия с дельфинами',
          de: 'Show-Ticket + Professionelles Fotoshooting mit Delfinen',
          fr: 'Billet spectacle + Séance photo professionnelle avec les dauphins',
          it: 'Biglietto spettacolo + Servizio fotografico professionale con delfini',
          pl: 'Bilet na pokaz + Profesjonalna sesja zdjęciowa z delfinami',
          es: 'Entrada espectáculo + Sesión de fotos profesional con delfines',
          uk: 'Шоу + Професійна фотосесія з дельфінами'
        },
        descriptions: {
          en: 'Watch the full performance and get photographed alongside friendly dolphins by a pro photographer with 3 printed glossy portraits.',
          ru: 'Просмотр шоу плюс персональная фотосессия у бортика бассейна с дельфинами и 3 готовых распечатанных глянцевых фото.',
          de: 'Show-Eintritt plus individuelles Fotoshooting am Beckenrand mit Delfinen inklusive 3 gedruckten Hochglanzfotos.',
          fr: 'Place pour le spectacle et séance photo au bord du bassin avec les dauphins, comprenant 3 tirages photo professionnels.',
          it: 'Spettacolo incluso più servizio fotografico a bordo vasca con i delfini e 3 foto stampate in alta qualità.',
          pl: 'Udział w pokazie oraz indywidualna sesja przy basenie z delfinami i 3 pamiątkowe zdjęcia w formacie pamiątkowym.',
          es: 'Entrada al show y sesión de fotos junto a la piscina con los delfines con 3 fotos profesionales impresas.',
          uk: 'Перегляд шоу плюс персональна фотосесія з дельфінами та 3 роздруковані глянцеві фото.'
        }
      },
      {
        id: 'opt-dolphin-swim-10',
        price: 55, // +$55 = $70 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'VIP Dolphin Swim (10 Minutes In-Water Encounter + Show)',
          ru: 'VIP Плавание с дельфинами (10 мин в воде + Шоу)',
          de: 'VIP-Delfinschwimmen (10 Min. im Wasser + Show)',
          fr: 'Baignade VIP avec les dauphins (10 min dans l’eau + Spectacle)',
          it: 'Nuoto VIP con i delfini (10 min in acqua + Spettacolo)',
          pl: 'VIP Pływanie z delfinami (10 min w wodzie + Pokaz)',
          es: 'Nado VIP con delfines (10 min en el agua + Espectáculo)',
          uk: 'VIP Плавання з дельфінами (10 хв у воді + Шоу)'
        },
        descriptions: {
          en: 'The ultimate encounter: slip into the water alongside trained dolphins for 10 unforgettable minutes of swimming, holding fins and playful interaction.',
          ru: 'Незабываемый опыт: 10 минут прямого контакта и плавания в воде в обнимку с дельфинами под наблюдением тренеров, плюс билет на шоу.',
          de: 'Das ultimative Erlebnis: 10 Minuten Schwimmen, Streicheln und Interaktion im Wasser mit trainierten Delfinen, plus Show-Ticket.',
          fr: 'Le summum de l’émotion: 10 minutes d’interaction directe et de nage dans le bassin avec les dauphins, spectacle inclus.',
          it: 'Esperienza indimenticabile: 10 minuti di nuoto e contatto diretto in acqua con i delfini, più biglietto dello spettacolo.',
          pl: 'Niezapomniane przeżycie: 10 minut bezpośredniego pływania i zabawy z delfinami w wodzie oraz bilet na pokaz.',
          es: 'La experiencia definitiva: 10 minutos en el agua nadando e interactuando con delfines, con entrada al show incluida.',
          uk: 'Незабутній досвід: 10 хвилин прямого контакту та плавання у воді з дельфінами, плюс квиток на шоу.'
        }
      }
    ],
    duplicateSlugs: [
      'dolphin-photo-session-hurghada',
      'swim-with-dolphins-10min-hurghada'
    ]
  },

  // Cluster 11: Hurghada Red Sea Scuba Diving
  {
    clusterId: 'hurghada-scuba-diving',
    clusterName: 'Cluster 11: Red Sea Scuba Diving',
    masterSlug: 'diving-trip-red-sea-hurghada',
    durationHours: 7,
    durationText: '7 Hours',
    adultPrice: 28,
    originalPrice: 40,
    options: [
      {
        id: 'opt-diving-intro-beginner',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Introductory Diving (2 Guided Dives with PADI Instructor)',
          ru: 'Ознакомительный дайвинг (2 погружения с инструктором PADI)',
          de: 'Schnuppertauchen (2 geführte Tauchgänge mit PADI-Tauchlehrer)',
          fr: 'Baptême de plongée (2 plongées guidées avec moniteur PADI)',
          it: 'Battesimo del mare (2 immersioni guidate con istruttore PADI)',
          pl: 'Nurkowanie wprowadzające (2 zejścia pod wodę z instruktorem PADI)',
          es: 'Bautismo de buceo (2 inmersiones guiadas con instructor PADI)',
          uk: 'Ознайомчий дайвінг (2 занурення з інструктором PADI)'
        },
        descriptions: {
          en: 'No prior experience needed: 2 separate 20-minute dives down to 7-8 meters with individual 1-on-1 instructor guidance, full scuba gear and freshly cooked boat lunch.',
          ru: 'Без опыта: 2 погружения по 20 минут на глубину 7-8 метров один-на-один с инструктором PADI, полный комплект оборудования и обед на корабле.',
          de: 'Keine Vorerfahrung nötig: 2 separate 20-minütige Tauchgänge auf 7-8 m mit 1-zu-1-Tauchlehrerbetreuung, Vollausrüstung und Mittagessen an Bord.',
          fr: 'Aucune expérience requise: 2 plongées de 20 min jusqu’à 7-8 mètres en tête-à-tête avec un moniteur, équipement complet et déjeuner sur le bateau.',
          it: 'Nessuna esperienza richiesta: 2 immersioni da 20 min fino a 7-8 metri con istruttore individuale, attrezzatura completa e pranzo a bordo.',
          pl: 'Nie wymaga doświadczenia: 2 zejścia po 20 min na głębokość 7-8 m pod opieką instruktora 1 na 1, pełny sprzęt i obiad na łodzi.',
          es: 'Sin experiencia previa: 2 inmersiones de 20 minutos hasta 7-8 metros con instructor individual, equipo de buceo completo y comida a bordo.',
          uk: 'Без досвіду: 2 занурення по 20 хвилин на глибину 7-8 метрів сам-на-сам з інструктором PADI, повне спорядження та обід.'
        }
      },
      {
        id: 'opt-diving-certified',
        price: 7, // +$7 = $35 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Certified Divers Package (2 Deep Reef Dives with Tanks & Weights)',
          ru: 'Для сертифицированных дайверов (2 глубоких погружения, баллоны и грузы)',
          de: 'Paket für zertifizierte Taucher (2 tiefe Rifftauchgänge inkl. Flaschen & Blei)',
          fr: 'Forfait plongeurs certifiés (2 plongées profondes, bouteilles & plombs)',
          it: 'Pacchetto subacquei brevettati (2 immersioni profonde con bombole e zavorra)',
          pl: 'Pakiet dla certyfikowanych nurków (2 głębokie nurkowania, butle i balast)',
          es: 'Paquete para buceadores certificados (2 inmersiones profundas con botellas y plomos)',
          uk: 'Для сертифікованих дайверів (2 глибоких занурення, балони та вантажі)'
        },
        descriptions: {
          en: 'For PADI/SSI Open Water certified divers: 2 full dives up to 30m exploring wrecks and outer reefs with divemaster guide, tanks and weight belts included.',
          ru: 'Для обладателей сертификатов PADI/SSI: 2 полноценных дайва до 30м на внешних рифах и рэках с гидом, баллоны и грузы включены.',
          de: 'Für PADI/SSI-zertifizierte Taucher: 2 ausgiebige Tauchgänge bis zu 30m an Riffen und Wracks mit Divemaster, Flaschen und Blei.',
          fr: 'Pour plongeurs certifiés PADI/SSI: 2 plongées complètes jusqu’à 30m sur épaves et tombants avec guide divemaster, blocs et plombs inclus.',
          it: 'Per possessori di brevetto PADI/SSI: 2 immersioni complete fino a 30m con guida divemaster, bombole e pesi inclusi.',
          pl: 'Dla certyfikowanych nurków PADI/SSI: 2 pełne nurkowania do 30m na rafach i wrakach z przewodnikiem divemaster, butle i balast w cenie.',
          es: 'Para buceadores titulados PADI/SSI: 2 inmersiones de hasta 30m en arrecifes y pecios con divemaster, botellas y plomos incluidos.',
          uk: 'Для власників сертифікатів PADI/SSI: 2 повноцінних дайви до 30м на зовнішніх рифах з гідом.'
        }
      },
      {
        id: 'opt-diving-snorkeler',
        price: -10, // -$10 discount = $18 total for non-diving companions
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: 'Accompanying Snorkeler / Non-Diver Day Pass',
          ru: 'Сопровождающий / Только снорклинг (без погружений)',
          de: 'Begleitender Schnorchler / Nicht-Taucher Tagespass',
          fr: 'Accompagnateur snorkeling / Pass non-plongeur',
          it: 'Accompagnatore snorkeling / Pass non subacqueo',
          pl: 'Osoba towarzysząca / Bilet na snorkeling (bez nurkowania)',
          es: 'Acompañante de snorkel / Pase para no buceadores',
          uk: 'Супроводжуючий / Тільки снорклінг (без занурень)'
        },
        descriptions: {
          en: 'Join friends or family on the dive yacht, enjoy open-air sun decks, guided snorkeling at coral reefs and freshly cooked buffet lunch.',
          ru: 'Прогулка на дайв-боте вместе с близкими: отдых на солнечной палубе, снорклинг на коралловых рифах и вкусный обед.',
          de: 'Kommen Sie mit Familie und Freunden auf die Tauchyacht: Sonnenbad an Deck, Schnorcheln an den Riffen und frisches Mittagsbuffet.',
          fr: 'Accompagnez vos proches sur le yacht de plongée: farniente sur le pont supérieur, snorkeling et déjeuner buffet frais.',
          it: 'Accompagna familiari o amici a bordo dello yacht: prendi il sole sul ponte, fai snorkeling sulla barriera corallina e pranza a bordo.',
          pl: 'Płyń z bliskimi na jachcie nurkowym: relaks na pokładzie słonecznym, snorkeling na rafach i świeży obiad w formie bufetu.',
          es: 'Acompaña a amigos o familiares en el yate: disfruta del solárium, snorkel en los arrecifes y almuerzo buffet.',
          uk: 'Прогулянка на дайв-боті разом з близькими: відпочинок на палубі, снорклінг та обід.'
        }
      }
    ],
    duplicateSlugs: [
      'hurghada-crystal-bay-diving-intro'
    ]
  },

  // Cluster 13: Sharm El Sheikh Sinai Desert Quad & Super Safari
  {
    clusterId: 'sharm-quad-safari',
    clusterName: 'Cluster 13: Sharm El Sheikh Desert Quad & Super Safari',
    masterSlug: 'desert-quad-bike-safari-sharm',
    durationHours: 3,
    durationText: '3 Hours',
    adultPrice: 22,
    originalPrice: 35,
    options: [
      {
        id: 'opt-sharm-quad-morning',
        price: 0,
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: '3-Hour Morning Desert Quad ATV Safari with Bedouin Tea',
          ru: '3-часовое утреннее сафари на квадроциклах с бедуинским чаем',
          de: '3-stündige morgendliche Quad-Safari mit Beduinentee',
          fr: 'Safari matinal en quad de 3h avec thé bédouin',
          it: 'Safari mattutino di 3 ore in quad con tè beduino',
          pl: '3-godzinne poranne safari na quadach z herbatą beduińską',
          es: 'Safari matutino de 3h en quad con té beduino',
          uk: '3-годинне ранкове сафарі на квадроциклах з бедуїнським чаєм'
        },
        descriptions: {
          en: 'Thrilling 3-hour morning ride across the Sinai mountain plains, Echo Temple stop, Bedouin hospitality and tea.',
          ru: 'Захватывающий утренний заезд по долинам Синайских гор, остановка у скалы Эхо, чай в гостях у бедуинов.',
          de: 'Morgendliche Quad-Fahrt durch die Wüstenlandschaft des Sinai, Halt am Echo-Felsen und Beduinentee im Zelt.',
          fr: 'Balade matinale intense à travers les plaines du Sinaï, arrêt au Temple de l’Écho et thé bédouin sous la tente.',
          it: 'Avventura mattutina di 3 ore tra le valli del Sinai, sosta alla montagna dell’Eco e tè nella tenda beduina.',
          pl: 'Ekscytująca poranna wyprawa quadami po bezdrożach Synaju, przystanek w Dolinie Echa i tradycyjna herbata.',
          es: 'Paseo matutino de 3h por el desierto del Sinaí, parada en el Templo del Eco y té beduino en jaima.',
          uk: 'Ранковий заїзд долинами Синайських гір, зупинка біля скелі Відлуння, чай у бедуїнів.'
        }
      },
      {
        id: 'opt-sharm-super-safari-dinner',
        price: 16, // +$16 = $38 total
        priceType: 'per_person',
        enabled: true,
        labels: {
          en: '6-Hour Evening Super Safari (Quad + Camel + Bedouin BBQ & Show)',
          ru: '6-часовое вечернее Супер Сафари (Квадроцикл + Верблюд + Ужин и шоу)',
          de: '6-stündige Abend-Super-Safari (Quad + Kamel + Beduinen-BBQ & Show)',
          fr: 'Super Safari en soirée de 6h (Quad + Chameau + Barbecue bédouin & Spectacle)',
          it: 'Super Safari serale di 6 ore (Quad + Cammello + Cena BBQ e Spettacolo)',
          pl: '6-godzinne wieczorne Super Safari (Quad + Wielbłąd + Kolacja BBQ i pokaz)',
          es: 'Súper Safari nocturno de 6h (Quad + Camello + Cena barbacoa y Show)',
          uk: '6-годинне вечірнє Супер Сафарі (Квадроцикл + Верблюд + Вечеря та шоу)'
        },
        descriptions: {
          en: 'Quad ATV sunset ride, gentle camel trek, open-air Bedouin tent BBQ dinner, Tanoura dancing, fire show and desert stargazing.',
          ru: 'Заезд на квадроциклах на закате, прогулка на верблюдах, ужин-барбекю в шатре бедуинов, танец танура, фаер-шоу и звездное небо.',
          de: 'Sonnenuntergangs-Quadfahrt, Kamelritt, Beduinen-BBQ im Wüstenzelt, Tanoura-Tanz, Feuershow und Sternenbeobachtung.',
          fr: 'Parcours en quad au coucher du soleil, balade à dos de chameau, dîner barbecue sous tente bédouine, spectacle de feu et danse Tanoura.',
          it: 'Giro in quad al tramonto, passeggiata a dorso di cammello, cena barbecue in tenda beduina, spettacolo di fuoco e danza Tanoura.',
          pl: 'Jazda quadem o zachodzie słońca, przejażdżka na wielbłądzie, kolacja BBQ w namiocie beduińskim, taniec tanoura i pokaz ognia.',
          es: 'Paseo en quad al atardecer, paseo en camello, cena barbacoa en jaima beduina, espectáculo de danza Tanoura y fuego.',
          uk: 'Заїзд на квадроциклах на заході сонця, прогулянка на верблюдах, вечеря-барбекю, танець танура та вогняне шоу.'
        }
      }
    ],
    duplicateSlugs: [
      'super-safari-sharm-el-sheikh'
    ]
  }
];

async function runConsolidation() {
  console.log('===============================================================');
  console.log('STARTING SELECTIVE HIGH-CONFIDENCE TOUR CONSOLIDATION');
  console.log('===============================================================');

  let mergedCount = 0;
  let redirectedCount = 0;

  for (const cluster of CLUSTERS) {
    console.log(`\n--- Processing ${cluster.clusterName} ---`);

    // 1. Locate Master Tour
    const master = await prisma.tour.findUnique({
      where: { slug: cluster.masterSlug },
      select: { id: true, slug: true, status: true, tourOptions: true }
    });

    if (!master) {
      console.error(`ERROR: Master tour with slug "${cluster.masterSlug}" NOT FOUND in DB! Skipping cluster.`);
      continue;
    }

    console.log(`Found master tour: id=${master.id}, slug=${master.slug}, status=${master.status}`);

    // 2. Update Master Tour with structured options, realistic duration and pricing
    await prisma.tour.update({
      where: { id: master.id },
      data: {
        tourOptions: cluster.options,
        durationHours: cluster.durationHours,
        duration: cluster.durationText,
        adultPrice: cluster.adultPrice,
        priceAdult: cluster.adultPrice,
        originalPrice: cluster.originalPrice,
        basePriceUSD: cluster.adultPrice,
        basePrice: cluster.adultPrice,
        status: 'ACTIVE',
      }
    });
    console.log(`Updated master tour ${master.slug} with ${cluster.options.length} options, duration: ${cluster.durationText}, price: $${cluster.adultPrice} (orig: $${cluster.originalPrice})`);

    // 3. Process Duplicate Tours
    for (const dupSlug of cluster.duplicateSlugs) {
      const dupTour = await prisma.tour.findUnique({
        where: { slug: dupSlug },
        select: { id: true, slug: true, status: true, _count: { select: { bookings: true } } }
      });

      if (!dupTour) {
        console.warn(`Warning: Duplicate tour slug "${dupSlug}" not found in DB.`);
      } else {
        console.log(`Found duplicate tour: id=${dupTour.id}, slug=${dupTour.slug}, bookings=${dupTour._count.bookings}`);

        // Set status to ARCHIVED (never hard-delete to preserve FKs)
        await prisma.tour.update({
          where: { id: dupTour.id },
          data: { status: 'ARCHIVED' }
        });
        mergedCount++;
      }

      // Upsert 301 TourRedirect record
      await prisma.tourRedirect.upsert({
        where: { sourceSlug: dupSlug },
        create: {
          sourceSlug: dupSlug,
          targetSlug: master.slug,
          statusCode: 301,
          reason: `Consolidated into master tour (${cluster.clusterName})`
        },
        update: {
          targetSlug: master.slug,
          statusCode: 301,
          reason: `Consolidated into master tour (${cluster.clusterName})`
        }
      });
      console.log(`Registered 301 redirect: /tours/${dupSlug} -> /tours/${master.slug}`);
      redirectedCount++;
    }
  }

  console.log('\n===============================================================');
  console.log('SELECTIVE CONSOLIDATION COMPLETED SUCCESSFULLY');
  console.log(`Total duplicate tours archived: ${mergedCount}`);
  console.log(`Total 301 redirects active: ${redirectedCount}`);

  // Count active tours in DB now
  const remainingActive = await prisma.tour.count({ where: { status: 'ACTIVE' } });
  const totalTours = await prisma.tour.count();
  const totalRedirects = await prisma.tourRedirect.count();
  console.log(`Database state: ${remainingActive} ACTIVE tours, ${totalTours - remainingActive} ARCHIVED tours, ${totalRedirects} redirects.`);
  console.log('===============================================================');
}

runConsolidation()
  .catch((err) => {
    console.error('Consolidation failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
