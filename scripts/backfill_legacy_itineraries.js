const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Structured itinerary backfill for 23 legacy tours with empty itineraries
// Each entry provides full 7-language itinerary inside translations object

const legacyBackfill = [
  {
    slug: 'desert-safari-3h-atv',
    translations: {
      en: {
        itinerary: [
          { timeTag: '03:30 PM', title: 'Hotel Pickup', description: 'Transfer to the departure point in the Eastern Desert.' },
          { timeTag: '04:00 PM', title: 'ATV Briefing & Safety', description: 'Safety briefing and ATV familiarization with your guide.' },
          { timeTag: '04:15 PM', title: 'Desert Ride', description: '3-hour thrilling ATV ride through golden sand dunes and desert tracks.' },
          { timeTag: '06:30 PM', title: 'Bedouin Village', description: 'Visit a traditional Bedouin camp and enjoy mint tea.' },
          { timeTag: '07:00 PM', title: 'Return Transfer', description: 'Drop-off back at your hotel.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '15:30 Uhr', title: 'Hotelabholung', description: 'Transfer zum Startpunkt in der östlichen Wüste.' },
          { timeTag: '16:00 Uhr', title: 'Sicherheitseinweisung', description: 'Einführung ins ATV-Fahren mit Schutzausrüstung.' },
          { timeTag: '16:15 Uhr', title: 'Wüstentour', description: '3-stündige ATV-Fahrt durch Sanddünen und Wüstenpisten.' },
          { timeTag: '18:30 Uhr', title: 'Beduinenlager', description: 'Besuch eines Beduinenzeltes mit Minztee.' },
          { timeTag: '19:00 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '15:30', title: 'Трансфер из отеля', description: 'Поездка к стартовой точке в восточной пустыне.' },
          { timeTag: '16:00', title: 'Инструктаж по безопасности', description: 'Знакомство с квадроциклом и правилами безопасности.' },
          { timeTag: '16:15', title: 'Поездка по пустыне', description: '3-часовое сафари на квадроцикле по барханам.' },
          { timeTag: '18:30', title: 'Бедуинская деревня', description: 'Посещение лагеря бедуинов и чай с мятой.' },
          { timeTag: '19:00', title: 'Возвращение в отель', description: 'Трансфер обратно в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '15:30', title: 'Partenza dall\'hotel', description: 'Transfer al punto di partenza nel deserto orientale.' },
          { timeTag: '16:00', title: 'Briefing di sicurezza', description: 'Istruzioni per l\'uso dell\'ATV e norme di sicurezza.' },
          { timeTag: '16:15', title: 'Tour nel deserto', description: 'Emozionante giro di 3 ore su ATV tra le dune dorate.' },
          { timeTag: '18:30', title: 'Villaggio beduino', description: 'Visita al campo beduino con degustazione di tè alla menta.' },
          { timeTag: '19:00', title: 'Rientro in hotel', description: 'Transfer di ritorno all\'hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '15:30', title: 'Prise en charge', description: 'Transfert vers le point de départ dans le désert de l\'Est.' },
          { timeTag: '16:00', title: 'Briefing sécurité', description: 'Présentation du quad et consignes de sécurité.' },
          { timeTag: '16:15', title: 'Randonnée dans le désert', description: '3h de quad palpitant à travers les dunes de sable dorées.' },
          { timeTag: '18:30', title: 'Village bédouin', description: 'Visite d\'un campement bédouin et thé à la menthe.' },
          { timeTag: '19:00', title: 'Retour à l\'hôtel', description: 'Transfert retour vers l\'hôtel.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '15:30', title: 'Odbiór z hotelu', description: 'Transfer do punktu startowego na wschodniej pustyni.' },
          { timeTag: '16:00', title: 'Briefing bezpieczeństwa', description: 'Zapoznanie z quadem i zasadami bezpieczeństwa.' },
          { timeTag: '16:15', title: 'Przejazd przez pustynię', description: '3-godzinna przejażdżka quadem przez złote wydmy.' },
          { timeTag: '18:30', title: 'Wioska beduińska', description: 'Wizyta w obozie beduińskim z herbatą miętową.' },
          { timeTag: '19:00', title: 'Powrót do hotelu', description: 'Transfer powrotny do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '15:30', title: 'Recogida en el hotel', description: 'Traslado al punto de salida en el desierto del Este.' },
          { timeTag: '16:00', title: 'Instrucciones de seguridad', description: 'Presentación del quad y normas de seguridad.' },
          { timeTag: '16:15', title: 'Safari en quad', description: '3 horas de emocionante recorrido en quad por las dunas.' },
          { timeTag: '18:30', title: 'Aldea beduina', description: 'Visita al campamento beduino con té de menta.' },
          { timeTag: '19:00', title: 'Regreso al hotel', description: 'Transfer de vuelta al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'orange-bay-island-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '08:30 AM', title: 'Hotel Pickup', description: 'Transfer to Hurghada marina.' },
          { timeTag: '09:30 AM', title: 'Set Sail to Orange Bay', description: 'Cruise to Orange Bay on Giftun Island.' },
          { timeTag: '10:30 AM', title: 'Beach Time on Orange Bay', description: '1.5 hours relaxing on the pristine white sand beach.' },
          { timeTag: '12:00 PM', title: 'Snorkeling Stop 1', description: 'Guided snorkeling above vibrant coral gardens.' },
          { timeTag: '01:30 PM', title: 'Lunch Onboard', description: 'Fresh buffet lunch with soft drinks served on deck.' },
          { timeTag: '02:30 PM', title: 'Snorkeling Stop 2', description: 'Second snorkeling stop at the outer reef.' },
          { timeTag: '04:30 PM', title: 'Return Transfer', description: 'Sail back to Hurghada and hotel drop-off.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '08:30 Uhr', title: 'Hotelabholung', description: 'Transfer zur Marina Hurghada.' },
          { timeTag: '09:30 Uhr', title: 'Fahrt nach Orange Bay', description: 'Bootsfahrt nach Orange Bay auf der Giftun-Insel.' },
          { timeTag: '10:30 Uhr', title: 'Strandaufenthalt', description: '1,5 Stunden Entspannung am weißen Sandstrand.' },
          { timeTag: '12:00 Uhr', title: 'Erster Schnorchelstopp', description: 'Schnorcheln über bunten Korallengärten.' },
          { timeTag: '13:30 Uhr', title: 'Mittagessen an Bord', description: 'Frisches Buffet mit Softdrinks.' },
          { timeTag: '14:30 Uhr', title: 'Zweiter Schnorchelstopp', description: 'Zweiter Schnorchelgang am Außenriff.' },
          { timeTag: '16:30 Uhr', title: 'Rücktransfer', description: 'Rückfahrt nach Hurghada und Hoteltransfer.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '08:30', title: 'Трансфер из отеля', description: 'Поездка в марину Хургады.' },
          { timeTag: '09:30', title: 'Выход на остров Оранж Бэй', description: 'Морская прогулка на остров Гифтун.' },
          { timeTag: '10:30', title: 'Отдых на пляже', description: '1,5 часа на белоснежном пляже Оранж Бэй.' },
          { timeTag: '12:00', title: 'Первый снорклинг', description: 'Плавание с маской над коралловыми садами.' },
          { timeTag: '13:30', title: 'Обед на борту', description: 'Шведский стол с напитками.' },
          { timeTag: '14:30', title: 'Второй снорклинг', description: 'Снорклинг у внешнего рифа.' },
          { timeTag: '16:30', title: 'Возвращение', description: 'Обратно в Хургаду и трансфер в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '08:30', title: 'Prelievo in hotel', description: 'Transfer al porto di Hurghada.' },
          { timeTag: '09:30', title: 'Navigazione verso Orange Bay', description: 'Crociera verso l\'Isola di Giftun.' },
          { timeTag: '10:30', title: 'Tempo in spiaggia', description: '1,5 ore di relax sulla spiaggia bianca.' },
          { timeTag: '12:00', title: 'Prima sessione snorkeling', description: 'Snorkeling guidato sulle barriere coralline.' },
          { timeTag: '13:30', title: 'Pranzo a bordo', description: 'Buffet fresco con bevande.' },
          { timeTag: '14:30', title: 'Seconda sessione snorkeling', description: 'Seconda immersione al reef esterno.' },
          { timeTag: '16:30', title: 'Rientro', description: 'Ritorno a Hurghada e transfer in hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '08:30', title: 'Prise en charge', description: 'Transfer vers la marina de Hurghada.' },
          { timeTag: '09:30', title: 'Navigation vers Orange Bay', description: 'Traversée vers l\'Île Giftun.' },
          { timeTag: '10:30', title: 'Plage Orange Bay', description: '1h30 de détente sur la plage de sable blanc.' },
          { timeTag: '12:00', title: 'Premier snorkeling', description: 'Plongée guidée au-dessus des jardins coralliens.' },
          { timeTag: '13:30', title: 'Déjeuner à bord', description: 'Buffet frais avec boissons.' },
          { timeTag: '14:30', title: 'Deuxième snorkeling', description: 'Deuxième session au récif extérieur.' },
          { timeTag: '16:30', title: 'Retour', description: 'Retour à Hurghada et transfert hôtel.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '08:30', title: 'Odbiór z hotelu', description: 'Transfer do mariny w Hurghadzie.' },
          { timeTag: '09:30', title: 'Rejs do Orange Bay', description: 'Podróż na wyspę Giftun.' },
          { timeTag: '10:30', title: 'Czas na plaży', description: '1,5 h relaksu na białej piaszczystej plaży.' },
          { timeTag: '12:00', title: 'Pierwszy snorkeling', description: 'Nurkowanie z rurką nad koralowymi ogrodami.' },
          { timeTag: '13:30', title: 'Obiad na pokładzie', description: 'Świeży bufet z napojami.' },
          { timeTag: '14:30', title: 'Drugi snorkeling', description: 'Druga sesja przy zewnętrznej rafie.' },
          { timeTag: '16:30', title: 'Powrót', description: 'Powrót do Hurghady i transfer do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '08:30', title: 'Recogida en el hotel', description: 'Traslado al puerto de Hurghada.' },
          { timeTag: '09:30', title: 'Navegación hacia Orange Bay', description: 'Crucero hacia la Isla Giftun.' },
          { timeTag: '10:30', title: 'Playa Orange Bay', description: '1,5 horas de relax en la playa de arena blanca.' },
          { timeTag: '12:00', title: 'Primer snorkel', description: 'Snorkel guiado sobre jardines de coral.' },
          { timeTag: '13:30', title: 'Almuerzo a bordo', description: 'Buffet fresco con bebidas.' },
          { timeTag: '14:30', title: 'Segundo snorkel', description: 'Segunda sesión en el arrecife exterior.' },
          { timeTag: '16:30', title: 'Regreso', description: 'Vuelta a Hurghada y traslado al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'luxor-valley-kings-day-trip',
    translations: {
      en: {
        itinerary: [
          { timeTag: '04:30 AM', title: 'Hotel Pickup', description: 'Early departure from your Hurghada hotel across the Eastern Desert.' },
          { timeTag: '09:00 AM', title: 'Colossi of Memnon', description: 'Brief stop at the iconic twin statues on the Nile west bank.' },
          { timeTag: '09:30 AM', title: 'Valley of the Kings', description: 'Enter 3 royal tombs with vivid wall paintings and hieroglyphics.' },
          { timeTag: '11:30 AM', title: 'Hatshepsut Temple', description: 'Visit the terraced cliff-side temple of Egypt\'s famous female Pharaoh.' },
          { timeTag: '12:30 PM', title: 'Nile Crossing & Lunch', description: 'Motorboat crossing of the Nile and traditional Egyptian lunch.' },
          { timeTag: '02:00 PM', title: 'Karnak Temple', description: 'Guided tour of the colossal hypostyle hall at Karnak.' },
          { timeTag: '04:00 PM', title: 'Return Drive', description: 'Depart Luxor and return to your Hurghada hotel.' },
          { timeTag: '08:30 PM', title: 'Hotel Arrival', description: 'Arrive back at your resort.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '04:30 Uhr', title: 'Abholung', description: 'Frühzeitige Abfahrt aus Hurghada in Richtung Luxor.' },
          { timeTag: '09:00 Uhr', title: 'Memnonkolosse', description: 'Kurzstop an den kolossalen Pharaonenstatuen.' },
          { timeTag: '09:30 Uhr', title: 'Tal der Könige', description: 'Besuch von 3 Königsgräbern mit farbenfrohen Wandgemälden.' },
          { timeTag: '11:30 Uhr', title: 'Hatschepsut-Tempel', description: 'Terrassentempel der einzigen Frau-Pharaonin.' },
          { timeTag: '12:30 Uhr', title: 'Nilüberquerung & Mittagessen', description: 'Motorbootfahrt und lokales Mittagessen.' },
          { timeTag: '14:00 Uhr', title: 'Karnak-Tempel', description: 'Führung durch die monumentale Säulenhalle.' },
          { timeTag: '16:00 Uhr', title: 'Rückfahrt', description: 'Rückreise nach Hurghada.' },
          { timeTag: '20:30 Uhr', title: 'Ankunft', description: 'Rückkehr ins Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '04:30', title: 'Выезд из отеля', description: 'Ранний выезд из Хургады через пустыню.' },
          { timeTag: '09:00', title: 'Колоссы Мемнона', description: 'Остановка у гигантских статуй фараона.' },
          { timeTag: '09:30', title: 'Долина Царей', description: 'Посещение 3 гробниц с оригинальными росписями.' },
          { timeTag: '11:30', title: 'Храм Хатшепсут', description: 'Экскурсия в храм единственной женщины-фараона.' },
          { timeTag: '12:30', title: 'Переправа через Нил и обед', description: 'Лодочная переправа и обед в местном ресторане.' },
          { timeTag: '14:00', title: 'Карнакский храм', description: 'Осмотр грандиозного храмового комплекса.' },
          { timeTag: '16:00', title: 'Обратный путь', description: 'Выезд в Хургаду.' },
          { timeTag: '20:30', title: 'Прибытие в отель', description: 'Возвращение на курорт.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '04:30', title: 'Partenza dall\'hotel', description: 'Partenza da Hurghada verso Luxor attraverso il deserto.' },
          { timeTag: '09:00', title: 'Colossi di Memnone', description: 'Sosta breve alle imponenti statue faraoniche.' },
          { timeTag: '09:30', title: 'Valle dei Re', description: 'Visita di 3 tombe reali con affreschi intatti.' },
          { timeTag: '11:30', title: 'Tempio di Hatshepsut', description: 'Visita al tempio a terrazze dell\'unica femmina-faraone.' },
          { timeTag: '12:30', title: 'Traversata del Nilo e Pranzo', description: 'Traversata in barca a motore e pranzo tipico.' },
          { timeTag: '14:00', title: 'Tempio di Karnak', description: 'Tour guidato nella colossale sala ipostila.' },
          { timeTag: '16:00', title: 'Ritorno', description: 'Rientro verso Hurghada.' },
          { timeTag: '20:30', title: 'Arrivo in hotel', description: 'Rientro al resort.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '04:30', title: 'Départ de l\'hôtel', description: 'Départ matinal de Hurghada vers Louxor.' },
          { timeTag: '09:00', title: 'Colosses de Memnon', description: 'Arrêt rapide aux imposantes statues pharaoniques.' },
          { timeTag: '09:30', title: 'Vallée des Rois', description: 'Visite de 3 tombes royales aux peintures préservées.' },
          { timeTag: '11:30', title: 'Temple d\'Hatchepsout', description: 'Temple terrasse de la seule femme pharaon d\'Égypte.' },
          { timeTag: '12:30', title: 'Traversée du Nil et Déjeuner', description: 'Traversée en bateau à moteur et déjeuner local.' },
          { timeTag: '14:00', title: 'Temple de Karnak', description: 'Visite guidée de la salle hypostyle monumentale.' },
          { timeTag: '16:00', title: 'Retour', description: 'Départ de Louxor vers Hurghada.' },
          { timeTag: '20:30', title: 'Arrivée à l\'hôtel', description: 'Retour au resort.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '04:30', title: 'Wyjazd z hotelu', description: 'Wczesny wyjazd z Hurghady do Luksoru.' },
          { timeTag: '09:00', title: 'Kolosy Memnona', description: 'Krótki postój przy imponujących posągach faraona.' },
          { timeTag: '09:30', title: 'Dolina Królów', description: 'Zwiedzanie 3 grobowców królewskich z zachowanymi malowidłami.' },
          { timeTag: '11:30', title: 'Świątynia Hatszepsut', description: 'Wizyta w świątyni jedynej kobiety-faraona.' },
          { timeTag: '12:30', title: 'Przeprawa przez Nil i Obiad', description: 'Rejs motorówką i tradycyjny egipski obiad.' },
          { timeTag: '14:00', title: 'Karnak', description: 'Zwiedzanie monumentalnej sali kolumnowej.' },
          { timeTag: '16:00', title: 'Powrót', description: 'Powrót do Hurghady.' },
          { timeTag: '20:30', title: 'Przyjazd do hotelu', description: 'Powrót do kurortu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '04:30', title: 'Salida del hotel', description: 'Salida temprana desde Hurghada hacia Lúxor.' },
          { timeTag: '09:00', title: 'Colosos de Memnón', description: 'Parada breve ante las estatuas faraónicas.' },
          { timeTag: '09:30', title: 'Valle de los Reyes', description: 'Visita a 3 tumbas reales con pinturas intactas.' },
          { timeTag: '11:30', title: 'Templo de Hatshepsut', description: 'Templo escalonado de la única faraona femenina.' },
          { timeTag: '12:30', title: 'Travesía del Nilo y Almuerzo', description: 'Travesía en lancha y almuerzo típico egipcio.' },
          { timeTag: '14:00', title: 'Templo de Karnak', description: 'Visita guiada a la sala hipóstila colosal.' },
          { timeTag: '16:00', title: 'Regreso', description: 'Vuelta hacia Hurghada.' },
          { timeTag: '20:30', title: 'Llegada al hotel', description: 'Retorno al resort.' }
        ]
      }
    }
  },
  {
    slug: 'family-safari-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '03:00 PM', title: 'Hotel Pickup', description: 'Transfer to the family safari departure area.' },
          { timeTag: '03:30 PM', title: 'Camel Ride', description: '20-minute camel ride through the desert landscape.' },
          { timeTag: '04:00 PM', title: 'Quad Bike Ride', description: 'Short family-friendly quad adventure on desert tracks.' },
          { timeTag: '04:45 PM', title: 'Sandboarding', description: 'Fun sandboarding on sand dunes (all ages welcome).' },
          { timeTag: '05:30 PM', title: 'Bedouin Village & Show', description: 'Traditional Bedouin performance and refreshments.' },
          { timeTag: '07:00 PM', title: 'Return Transfer', description: 'Drop-off back at your hotel.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '15:00 Uhr', title: 'Abholung', description: 'Transfer zum Familiensafari-Startpunkt.' },
          { timeTag: '15:30 Uhr', title: 'Kamelreiten', description: '20-minütige Kamelfahrt durch die Wüste.' },
          { timeTag: '16:00 Uhr', title: 'Quad-Tour', description: 'Familienfreundliche Quad-Fahrt auf Wüstenpisten.' },
          { timeTag: '16:45 Uhr', title: 'Sandboarden', description: 'Spaß auf Sanddünen für die ganze Familie.' },
          { timeTag: '17:30 Uhr', title: 'Beduinendorf & Show', description: 'Traditionelle Vorführung mit Erfrischungen.' },
          { timeTag: '19:00 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '15:00', title: 'Трансфер из отеля', description: 'Поездка к стартовой точке семейного сафари.' },
          { timeTag: '15:30', title: 'Катание на верблюде', description: '20 минут на верблюде по пустыне.' },
          { timeTag: '16:00', title: 'Квадроцикл', description: 'Семейная поездка на квадроцикле.' },
          { timeTag: '16:45', title: 'Сёрфинг по песку', description: 'Весёлое катание на досках по дюнам.' },
          { timeTag: '17:30', title: 'Бедуинская деревня', description: 'Традиционное шоу и угощение.' },
          { timeTag: '19:00', title: 'Возвращение в отель', description: 'Трансфер обратно в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '15:00', title: 'Prelievo in hotel', description: 'Transfer al punto di partenza del safari familiare.' },
          { timeTag: '15:30', title: 'Giro in cammello', description: '20 minuti in cammello nel deserto.' },
          { timeTag: '16:00', title: 'Tour in quad', description: 'Percorso quad adatto alle famiglie.' },
          { timeTag: '16:45', title: 'Sandboarding', description: 'Divertimento sulle dune per tutta la famiglia.' },
          { timeTag: '17:30', title: 'Villaggio beduino', description: 'Spettacolo tradizionale e rinfreschi.' },
          { timeTag: '19:00', title: 'Rientro in hotel', description: 'Transfer di ritorno.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '15:00', title: 'Prise en charge', description: 'Transfer au point de départ du safari famille.' },
          { timeTag: '15:30', title: 'Balade à dos de chameau', description: '20 minutes de balade chameau dans le désert.' },
          { timeTag: '16:00', title: 'Quad', description: 'Aventure quad familiale sur pistes de sable.' },
          { timeTag: '16:45', title: 'Sandboard', description: 'Glisse sur les dunes pour petits et grands.' },
          { timeTag: '17:30', title: 'Village bédouin', description: 'Spectacle traditionnel et rafraîchissements.' },
          { timeTag: '19:00', title: 'Retour à l\'hôtel', description: 'Transfer retour.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '15:00', title: 'Odbiór z hotelu', description: 'Transfer do punktu startowego safari rodzinnego.' },
          { timeTag: '15:30', title: 'Jazda na wielbłądzie', description: '20-minutowa przejażdżka wielbłądem przez pustynię.' },
          { timeTag: '16:00', title: 'Quad', description: 'Rodzinna przejażdżka quadem po pustyni.' },
          { timeTag: '16:45', title: 'Sandboarding', description: 'Zabawa na wydmach dla całej rodziny.' },
          { timeTag: '17:30', title: 'Wioska beduińska', description: 'Tradycyjny pokaz i przekąski.' },
          { timeTag: '19:00', title: 'Powrót do hotelu', description: 'Transfer powrotny.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '15:00', title: 'Recogida en el hotel', description: 'Traslado al punto de salida del safari familiar.' },
          { timeTag: '15:30', title: 'Paseo en camello', description: '20 minutos de paseo en camello por el desierto.' },
          { timeTag: '16:00', title: 'Quad', description: 'Aventura en quad apta para familias.' },
          { timeTag: '16:45', title: 'Sandboarding', description: 'Deslizamiento en las dunas para toda la familia.' },
          { timeTag: '17:30', title: 'Aldea beduina', description: 'Espectáculo tradicional y refrescos.' },
          { timeTag: '19:00', title: 'Regreso al hotel', description: 'Transfer de vuelta.' }
        ]
      }
    }
  },
  {
    slug: 'star-gazing-safari-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '06:00 PM', title: 'Hotel Pickup', description: 'Transfer to the desert observation site away from city lights.' },
          { timeTag: '07:00 PM', title: 'Camel Ride at Sunset', description: 'Scenic camel ride as the sun sets over the desert.' },
          { timeTag: '07:30 PM', title: 'Bedouin Dinner', description: 'Traditional Bedouin dinner under the stars — rice, grilled meats, and hot tea.' },
          { timeTag: '08:30 PM', title: 'Astronomy Session', description: 'Expert guide explains constellations and uses telescopes to view planets and stars.' },
          { timeTag: '10:00 PM', title: 'Return Transfer', description: 'Drop-off back at your Hurghada hotel.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '18:00 Uhr', title: 'Hotelabholung', description: 'Fahrt zum Sternbeobachtungsplatz in der Wüste.' },
          { timeTag: '19:00 Uhr', title: 'Kamelritt bei Sonnenuntergang', description: 'Stimmungsvolle Kamelfahrt beim Sonnenuntergang.' },
          { timeTag: '19:30 Uhr', title: 'Beduinen-Abendessen', description: 'Traditionelles Abendessen unter dem Sternenhimmel.' },
          { timeTag: '20:30 Uhr', title: 'Astronomie-Session', description: 'Sternbeobachtung mit Teleskop und fachkundiger Führung.' },
          { timeTag: '22:00 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '18:00', title: 'Трансфер из отеля', description: 'Поездка на площадку наблюдения за звёздами в пустыне.' },
          { timeTag: '19:00', title: 'Катание на верблюде на закате', description: 'Верблюжья прогулка в лучах заходящего солнца.' },
          { timeTag: '19:30', title: 'Бедуинский ужин', description: 'Традиционный ужин под звёздным небом.' },
          { timeTag: '20:30', title: 'Астрономия', description: 'Наблюдение за звёздами и планетами через телескоп.' },
          { timeTag: '22:00', title: 'Возвращение в отель', description: 'Трансфер обратно в Хургаду.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '18:00', title: 'Prelievo in hotel', description: 'Transfer al sito di osservazione nel deserto.' },
          { timeTag: '19:00', title: 'Giro in cammello al tramonto', description: 'Suggestiva passeggiata in cammello durante il tramonto.' },
          { timeTag: '19:30', title: 'Cena beduina', description: 'Cena tradizionale sotto un cielo stellato.' },
          { timeTag: '20:30', title: 'Sessione astronomica', description: 'Osservazione delle stelle con telescopio e guida esperta.' },
          { timeTag: '22:00', title: 'Rientro in hotel', description: 'Transfer di ritorno.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '18:00', title: 'Prise en charge', description: 'Transfer vers le site d\'observation dans le désert.' },
          { timeTag: '19:00', title: 'Balade chameau au coucher du soleil', description: 'Promenade à dos de chameau au crépuscule.' },
          { timeTag: '19:30', title: 'Dîner bédouin', description: 'Repas traditionnel sous un ciel étoilé.' },
          { timeTag: '20:30', title: 'Session astronomie', description: 'Observation des étoiles au télescope avec guide expert.' },
          { timeTag: '22:00', title: 'Retour à l\'hôtel', description: 'Transfer retour.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '18:00', title: 'Odbiór z hotelu', description: 'Transfer na miejsce obserwacji gwiazd na pustyni.' },
          { timeTag: '19:00', title: 'Jazda na wielbłądzie o zachodzie słońca', description: 'Malownicza przejażdżka wielbłądem o zmierzchu.' },
          { timeTag: '19:30', title: 'Kolacja beduińska', description: 'Tradycyjna kolacja pod gwiazdami.' },
          { timeTag: '20:30', title: 'Sesja astronomiczna', description: 'Obserwacja gwiazd przez teleskop z ekspertem.' },
          { timeTag: '22:00', title: 'Powrót do hotelu', description: 'Transfer powrotny.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '18:00', title: 'Recogida en el hotel', description: 'Traslado al sitio de observación en el desierto.' },
          { timeTag: '19:00', title: 'Paseo en camello al atardecer', description: 'Panorámica en camello durante la puesta de sol.' },
          { timeTag: '19:30', title: 'Cena beduina', description: 'Cena tradicional bajo el cielo estrellado.' },
          { timeTag: '20:30', title: 'Sesión de astronomía', description: 'Observación de estrellas con telescopio y guía experto.' },
          { timeTag: '22:00', title: 'Regreso al hotel', description: 'Transfer de vuelta.' }
        ]
      }
    }
  },
  {
    slug: 'swim-with-dolphins-10min-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '09:00 AM', title: 'Hotel Pickup', description: 'Transfer to the Hurghada dolphin facility.' },
          { timeTag: '09:45 AM', title: 'Safety Briefing', description: 'Brief safety orientation and rules for swimming with dolphins.' },
          { timeTag: '10:00 AM', title: 'Dolphin Swim Session', description: '10-minute supervised swim with trained dolphins in the lagoon.' },
          { timeTag: '10:30 AM', title: 'Photo Opportunity', description: 'Optional photos and souvenir purchase.' },
          { timeTag: '11:00 AM', title: 'Return Transfer', description: 'Drop-off back at your hotel.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '09:00 Uhr', title: 'Hotelabholung', description: 'Transfer zur Delphinanlage Hurghada.' },
          { timeTag: '09:45 Uhr', title: 'Sicherheitseinweisung', description: 'Kurze Einführung in die Verhaltensregeln.' },
          { timeTag: '10:00 Uhr', title: 'Schwimmen mit Delfinen', description: '10 Minuten Schwimmen mit ausgebildeten Delfinen.' },
          { timeTag: '10:30 Uhr', title: 'Fotos', description: 'Optionale Fotos und Souvenirs.' },
          { timeTag: '11:00 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '09:00', title: 'Трансфер из отеля', description: 'Поездка к дельфинарию в Хургаде.' },
          { timeTag: '09:45', title: 'Инструктаж', description: 'Краткий инструктаж по правилам общения с дельфинами.' },
          { timeTag: '10:00', title: 'Плавание с дельфинами', description: '10 минут плавания с дрессированными дельфинами.' },
          { timeTag: '10:30', title: 'Фото', description: 'Фотосессия и сувениры (по желанию).' },
          { timeTag: '11:00', title: 'Возвращение в отель', description: 'Трансфер обратно.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '09:00', title: 'Prelievo in hotel', description: 'Transfer alla struttura dei delfini a Hurghada.' },
          { timeTag: '09:45', title: 'Briefing sicurezza', description: 'Breve orientamento e regole di sicurezza.' },
          { timeTag: '10:00', title: 'Nuoto con i delfini', description: '10 minuti di nuoto con i delfini ammaestrati.' },
          { timeTag: '10:30', title: 'Foto', description: 'Foto ricordo e souvenir (opzionale).' },
          { timeTag: '11:00', title: 'Rientro in hotel', description: 'Transfer di ritorno.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '09:00', title: 'Prise en charge', description: 'Transfer vers la structure dauphins de Hurghada.' },
          { timeTag: '09:45', title: 'Briefing sécurité', description: 'Règles et consignes avant l\'activité.' },
          { timeTag: '10:00', title: 'Nage avec les dauphins', description: '10 minutes de nage encadrée avec les dauphins dressés.' },
          { timeTag: '10:30', title: 'Photos', description: 'Photos souvenir et boutique (en option).' },
          { timeTag: '11:00', title: 'Retour à l\'hôtel', description: 'Transfer retour.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '09:00', title: 'Odbiór z hotelu', description: 'Transfer do ośrodka z delfinami w Hurghadzie.' },
          { timeTag: '09:45', title: 'Briefing bezpieczeństwa', description: 'Zasady obcowania z delfinami.' },
          { timeTag: '10:00', title: 'Pływanie z delfinami', description: '10 minut pływania z tresowanymi delfinami.' },
          { timeTag: '10:30', title: 'Zdjęcia', description: 'Sesja zdjęciowa i pamiątki (opcjonalnie).' },
          { timeTag: '11:00', title: 'Powrót do hotelu', description: 'Transfer powrotny.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '09:00', title: 'Recogida en el hotel', description: 'Traslado al delfinario de Hurghada.' },
          { timeTag: '09:45', title: 'Instrucciones de seguridad', description: 'Normas de comportamiento con los delfines.' },
          { timeTag: '10:00', title: 'Nadar con delfines', description: '10 minutos de natación supervisada con delfines.' },
          { timeTag: '10:30', title: 'Fotos', description: 'Fotografías y recuerdos (opcional).' },
          { timeTag: '11:00', title: 'Regreso al hotel', description: 'Transfer de vuelta.' }
        ]
      }
    }
  },
  {
    slug: 'dolphinarium-show-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '10:00 AM', title: 'Hotel Pickup', description: 'Transfer to Hurghada dolphinarium.' },
          { timeTag: '11:00 AM', title: 'Dolphin & Sea Lion Show', description: '45-minute live performance with trained dolphins and sea lions.' },
          { timeTag: '12:00 PM', title: 'Meet & Greet', description: 'Supervised interaction and photo opportunity with dolphins.' },
          { timeTag: '12:30 PM', title: 'Return Transfer', description: 'Drop-off back at your hotel.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '10:00 Uhr', title: 'Hotelabholung', description: 'Transfer zum Delphinarium Hurghada.' },
          { timeTag: '11:00 Uhr', title: 'Delfin- & Seelöwen-Show', description: '45-minütige Live-Vorführung mit dressierten Tieren.' },
          { timeTag: '12:00 Uhr', title: 'Begegnung & Fotos', description: 'Betreuter Kontakt und Fotoshooting mit Delfinen.' },
          { timeTag: '12:30 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '10:00', title: 'Трансфер из отеля', description: 'Поездка в дельфинарий Хургады.' },
          { timeTag: '11:00', title: 'Шоу дельфинов и морских львов', description: '45-минутное живое выступление с дрессированными животными.' },
          { timeTag: '12:00', title: 'Встреча и фото', description: 'Общение с дельфинами и фотосессия.' },
          { timeTag: '12:30', title: 'Возвращение в отель', description: 'Трансфер обратно.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '10:00', title: 'Prelievo in hotel', description: 'Transfer al delfinario di Hurghada.' },
          { timeTag: '11:00', title: 'Spettacolo delfini e leoni marini', description: 'Show dal vivo di 45 minuti con delfini ammaestrati.' },
          { timeTag: '12:00', title: 'Incontro e foto', description: 'Interazione supervisionata e foto con i delfini.' },
          { timeTag: '12:30', title: 'Rientro in hotel', description: 'Transfer di ritorno.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '10:00', title: 'Prise en charge', description: 'Transfer vers le delphinarium de Hurghada.' },
          { timeTag: '11:00', title: 'Spectacle dauphins & otaries', description: 'Show en direct de 45 minutes.' },
          { timeTag: '12:00', title: 'Rencontre et photos', description: 'Interaction encadrée et séance photo avec les dauphins.' },
          { timeTag: '12:30', title: 'Retour à l\'hôtel', description: 'Transfer retour.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '10:00', title: 'Odbiór z hotelu', description: 'Transfer do delfinarium w Hurghadzie.' },
          { timeTag: '11:00', title: 'Pokaz delfinów i lwów morskich', description: '45-minutowy pokaz na żywo z tresowanymi zwierzętami.' },
          { timeTag: '12:00', title: 'Spotkanie i zdjęcia', description: 'Kontakt z delfinami pod nadzorem i sesja zdjęciowa.' },
          { timeTag: '12:30', title: 'Powrót do hotelu', description: 'Transfer powrotny.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '10:00', title: 'Recogida en el hotel', description: 'Traslado al delfinario de Hurghada.' },
          { timeTag: '11:00', title: 'Espectáculo de delfines y leones marinos', description: 'Show en vivo de 45 minutos con animales entrenados.' },
          { timeTag: '12:00', title: 'Encuentro y fotos', description: 'Interacción supervisada y sesión fotográfica con los delfines.' },
          { timeTag: '12:30', title: 'Regreso al hotel', description: 'Transfer de vuelta.' }
        ]
      }
    }
  },
  {
    slug: 'hula-hula-paradise-island-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '09:00 AM', title: 'Hotel Pickup', description: 'Transfer to Hurghada marina.' },
          { timeTag: '10:00 AM', title: 'Sail to Hula Hula Island', description: 'Cruise to the private paradise island.' },
          { timeTag: '11:00 AM', title: 'Beach & Snorkeling', description: 'Relax on the island beach and snorkel at the reef.' },
          { timeTag: '01:00 PM', title: 'Lunch Onboard', description: 'Fresh buffet lunch with soft drinks served on the boat.' },
          { timeTag: '02:00 PM', title: 'Water Sports', description: 'Optional water sports including banana boat and tubes.' },
          { timeTag: '04:00 PM', title: 'Return Transfer', description: 'Sail back to Hurghada and hotel drop-off.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '09:00 Uhr', title: 'Hotelabholung', description: 'Transfer zur Marina Hurghada.' },
          { timeTag: '10:00 Uhr', title: 'Fahrt zur Insel', description: 'Bootsfahrt zur Hula-Hula-Insel.' },
          { timeTag: '11:00 Uhr', title: 'Strand & Schnorcheln', description: 'Strand und Schnorcheln am Riff.' },
          { timeTag: '13:00 Uhr', title: 'Mittagessen an Bord', description: 'Frisches Buffet mit Softdrinks.' },
          { timeTag: '14:00 Uhr', title: 'Wassersport', description: 'Optionale Wassersportaktivitäten.' },
          { timeTag: '16:00 Uhr', title: 'Rücktransfer', description: 'Rückfahrt nach Hurghada.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '09:00', title: 'Трансфер', description: 'Поездка в марину Хургады.' },
          { timeTag: '10:00', title: 'Прогулка к острову', description: 'Морская прогулка на остров Хула-Хула.' },
          { timeTag: '11:00', title: 'Пляж и снорклинг', description: 'Отдых на пляже острова и снорклинг.' },
          { timeTag: '13:00', title: 'Обед на борту', description: 'Шведский стол с напитками.' },
          { timeTag: '14:00', title: 'Водные развлечения', description: 'Банан, тюбинг и другие аттракционы (по желанию).' },
          { timeTag: '16:00', title: 'Возвращение', description: 'Обратно в Хургаду и трансфер в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '09:00', title: 'Prelievo in hotel', description: 'Transfer al porto di Hurghada.' },
          { timeTag: '10:00', title: 'Navigazione verso l\'isola', description: 'Crociera verso l\'Isola Hula Hula.' },
          { timeTag: '11:00', title: 'Spiaggia e snorkeling', description: 'Relax sulla spiaggia e snorkeling al reef.' },
          { timeTag: '13:00', title: 'Pranzo a bordo', description: 'Buffet fresco con bevande.' },
          { timeTag: '14:00', title: 'Sport acquatici', description: 'Attività opzionali: banana boat e gonfiabili.' },
          { timeTag: '16:00', title: 'Rientro', description: 'Ritorno a Hurghada e transfer hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '09:00', title: 'Prise en charge', description: 'Transfer vers la marina de Hurghada.' },
          { timeTag: '10:00', title: 'Navigation vers l\'île', description: 'Croisière vers l\'Île Hula Hula.' },
          { timeTag: '11:00', title: 'Plage et snorkeling', description: 'Détente sur la plage et plongée au récif.' },
          { timeTag: '13:00', title: 'Déjeuner à bord', description: 'Buffet frais avec boissons.' },
          { timeTag: '14:00', title: 'Sports nautiques', description: 'Activités optionnelles en mer.' },
          { timeTag: '16:00', title: 'Retour à l\'hôtel', description: 'Retour à Hurghada et transfer.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '09:00', title: 'Odbiór z hotelu', description: 'Transfer do mariny w Hurghadzie.' },
          { timeTag: '10:00', title: 'Rejs na wyspę', description: 'Podróż na Wyspę Hula Hula.' },
          { timeTag: '11:00', title: 'Plaża i snorkeling', description: 'Odpoczynek na plaży i nurkowanie z rurką.' },
          { timeTag: '13:00', title: 'Obiad na pokładzie', description: 'Świeży bufet z napojami.' },
          { timeTag: '14:00', title: 'Sporty wodne', description: 'Banan, koło i inne atrakcje (opcjonalnie).' },
          { timeTag: '16:00', title: 'Powrót', description: 'Powrót do Hurghady i transfer do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '09:00', title: 'Recogida en el hotel', description: 'Traslado al puerto de Hurghada.' },
          { timeTag: '10:00', title: 'Navegación hacia la isla', description: 'Crucero hacia la Isla Hula Hula.' },
          { timeTag: '11:00', title: 'Playa y snorkel', description: 'Relax en la playa y snorkel en el arrecife.' },
          { timeTag: '13:00', title: 'Almuerzo a bordo', description: 'Buffet fresco con bebidas.' },
          { timeTag: '14:00', title: 'Deportes acuáticos', description: 'Actividades opcionales: banana boat y flotadores.' },
          { timeTag: '16:00', title: 'Regreso', description: 'Vuelta a Hurghada y traslado al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'spa-body-massage-1h-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '10:00 AM', title: 'Arrival at Spa', description: 'Welcome reception and consultation with therapist.' },
          { timeTag: '10:15 AM', title: 'Shower & Preparation', description: 'Refreshing pre-treatment shower.' },
          { timeTag: '10:30 AM', title: '60-Minute Full Body Massage', description: 'Relaxing full body massage with aromatic oils.' },
          { timeTag: '11:30 AM', title: 'Relaxation & Refreshments', description: 'Post-massage relaxation with herbal tea or juice.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '10:00 Uhr', title: 'Ankunft im Spa', description: 'Empfang und Beratungsgespräch.' },
          { timeTag: '10:15 Uhr', title: 'Dusche & Vorbereitung', description: 'Erfrischende Vorbehandlungsdusche.' },
          { timeTag: '10:30 Uhr', title: '60-minütige Ganzkörpermassage', description: 'Entspannende Massage mit aromatischen Ölen.' },
          { timeTag: '11:30 Uhr', title: 'Entspannung & Erfrischung', description: 'Nachbehandlung mit Kräutertee.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '10:00', title: 'Прибытие в спа', description: 'Приём и консультация с терапевтом.' },
          { timeTag: '10:15', title: 'Душ и подготовка', description: 'Освежающий душ перед процедурой.' },
          { timeTag: '10:30', title: 'Массаж всего тела 60 минут', description: 'Расслабляющий массаж с ароматными маслами.' },
          { timeTag: '11:30', title: 'Отдых и напитки', description: 'Релаксация с травяным чаем после массажа.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '10:00', title: 'Arrivo alla Spa', description: 'Accoglienza e consulenza con il terapista.' },
          { timeTag: '10:15', title: 'Doccia e preparazione', description: 'Doccia rinfrescante pre-trattamento.' },
          { timeTag: '10:30', title: 'Massaggio corpo 60 minuti', description: 'Massaggio distensivo con oli aromatici.' },
          { timeTag: '11:30', title: 'Relax e rinfreschi', description: 'Relax post-massaggio con tisana o succo.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '10:00', title: 'Arrivée au Spa', description: 'Accueil et consultation avec le thérapeute.' },
          { timeTag: '10:15', title: 'Douche et préparation', description: 'Douche rafraîchissante avant le soin.' },
          { timeTag: '10:30', title: 'Massage corps 60 minutes', description: 'Massage relaxant aux huiles aromatiques.' },
          { timeTag: '11:30', title: 'Détente et rafraîchissements', description: 'Relaxation post-massage avec infusion.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '10:00', title: 'Przyjazd do spa', description: 'Powitanie i konsultacja z terapeutą.' },
          { timeTag: '10:15', title: 'Prysznic i przygotowanie', description: 'Odświeżający prysznic przed zabiegiem.' },
          { timeTag: '10:30', title: 'Masaż całego ciała 60 minut', description: 'Relaksujący masaż z aromatycznymi olejkami.' },
          { timeTag: '11:30', title: 'Relaks i napoje', description: 'Odpoczynek z herbatką ziołową po masażu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '10:00', title: 'Llegada al spa', description: 'Recepción y consulta con el terapeuta.' },
          { timeTag: '10:15', title: 'Ducha y preparación', description: 'Ducha refrescante previa al tratamiento.' },
          { timeTag: '10:30', title: 'Masaje corporal 60 minutos', description: 'Masaje relajante con aceites aromáticos.' },
          { timeTag: '11:30', title: 'Descanso y refrigerios', description: 'Relajación con infusión de hierbas tras el masaje.' }
        ]
      }
    }
  },
  {
    slug: 'luxor-mini-group-valley-kings',
    translations: {
      en: {
        itinerary: [
          { timeTag: '04:30 AM', title: 'Hotel Pickup', description: 'Small group morning departure from Hurghada to Luxor.' },
          { timeTag: '08:30 AM', title: 'Karnak Temple', description: 'Guided mini-group visit to the legendary Karnak complex.' },
          { timeTag: '10:30 AM', title: 'Nile Crossing', description: 'Motorboat crossing to the Nile west bank.' },
          { timeTag: '11:00 AM', title: 'Valley of the Kings', description: '3 royal tombs with original polychrome wall paintings.' },
          { timeTag: '12:30 PM', title: 'Lunch at Nile Restaurant', description: 'Traditional Egyptian meal at a riverside restaurant.' },
          { timeTag: '02:00 PM', title: 'Hatshepsut Temple', description: 'The terraced cliff temple of Egypt\'s female Pharaoh.' },
          { timeTag: '03:00 PM', title: 'Return Journey', description: 'Head back to Hurghada.' },
          { timeTag: '07:00 PM', title: 'Hotel Arrival', description: 'Drop-off at your resort.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '04:30 Uhr', title: 'Abholung', description: 'Kleingruppenausflug von Hurghada nach Luxor.' },
          { timeTag: '08:30 Uhr', title: 'Karnak', description: 'Geführte Besichtigung des Karnak-Komplexes.' },
          { timeTag: '10:30 Uhr', title: 'Nilüberquerung', description: 'Motorbootfahrt ans westliche Nilufer.' },
          { timeTag: '11:00 Uhr', title: 'Tal der Könige', description: '3 Königsgräber mit farbenfrohen Wandgemälden.' },
          { timeTag: '12:30 Uhr', title: 'Mittagessen', description: 'Traditionelles Mittagessen am Nil.' },
          { timeTag: '14:00 Uhr', title: 'Hatschepsut-Tempel', description: 'Terrassentempel der Frau-Pharaonin.' },
          { timeTag: '15:00 Uhr', title: 'Rückfahrt', description: 'Rückkehr nach Hurghada.' },
          { timeTag: '19:00 Uhr', title: 'Ankunft', description: 'Ankunft im Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '04:30', title: 'Трансфер', description: 'Выезд малой группой из Хургады в Луксор.' },
          { timeTag: '08:30', title: 'Карнак', description: 'Экскурсия по Карнакскому храмовому комплексу.' },
          { timeTag: '10:30', title: 'Переправа через Нил', description: 'Лодочная переправа на западный берег Нила.' },
          { timeTag: '11:00', title: 'Долина Царей', description: 'Три царских гробницы с оригинальными росписями.' },
          { timeTag: '12:30', title: 'Обед', description: 'Традиционный обед у берега Нила.' },
          { timeTag: '14:00', title: 'Храм Хатшепсут', description: 'Террасный храм египетской фараонши.' },
          { timeTag: '15:00', title: 'Обратный путь', description: 'Возвращение в Хургаду.' },
          { timeTag: '19:00', title: 'Прибытие', description: 'Заезд в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '04:30', title: 'Partenza', description: 'Piccolo gruppo da Hurghada verso Luxor.' },
          { timeTag: '08:30', title: 'Karnak', description: 'Visita guidata al complesso di Karnak.' },
          { timeTag: '10:30', title: 'Traversata del Nilo', description: 'Barca a motore sulla riva ovest del Nilo.' },
          { timeTag: '11:00', title: 'Valle dei Re', description: '3 tombe reali con pitture originali.' },
          { timeTag: '12:30', title: 'Pranzo', description: 'Pranzo tradizionale sul Nilo.' },
          { timeTag: '14:00', title: 'Tempio di Hatshepsut', description: 'Tempio a terrazze scavato nella roccia.' },
          { timeTag: '15:00', title: 'Rientro', description: 'Ritorno verso Hurghada.' },
          { timeTag: '19:00', title: 'Arrivo in hotel', description: 'Rientro al resort.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '04:30', title: 'Départ', description: 'Petit groupe depuis Hurghada vers Louxor.' },
          { timeTag: '08:30', title: 'Karnak', description: 'Visite guidée du complexe de Karnak.' },
          { timeTag: '10:30', title: 'Traversée du Nil', description: 'Bateau à moteur vers la rive ouest.' },
          { timeTag: '11:00', title: 'Vallée des Rois', description: '3 tombes royales aux peintures intactes.' },
          { timeTag: '12:30', title: 'Déjeuner', description: 'Repas traditionnel au bord du Nil.' },
          { timeTag: '14:00', title: 'Temple d\'Hatchepsout', description: 'Temple terrasse de la femme pharaon.' },
          { timeTag: '15:00', title: 'Retour', description: 'Retour à Hurghada.' },
          { timeTag: '19:00', title: 'Arrivée', description: 'Arrivée à l\'hôtel.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '04:30', title: 'Wyjazd', description: 'Mała grupa z Hurghady do Luksoru.' },
          { timeTag: '08:30', title: 'Karnak', description: 'Zwiedzanie kompleksu świątynnego Karnak.' },
          { timeTag: '10:30', title: 'Przeprawa przez Nil', description: 'Motorówką na zachodni brzeg Nilu.' },
          { timeTag: '11:00', title: 'Dolina Królów', description: '3 grobowce z oryginalnymi malowidłami.' },
          { timeTag: '12:30', title: 'Obiad', description: 'Tradycyjny obiad nad Nilem.' },
          { timeTag: '14:00', title: 'Świątynia Hatszepsut', description: 'Tarasowa świątynia kobiety-faraona.' },
          { timeTag: '15:00', title: 'Powrót', description: 'Powrót do Hurghady.' },
          { timeTag: '19:00', title: 'Przyjazd', description: 'Przyjazd do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '04:30', title: 'Salida', description: 'Grupo pequeño desde Hurghada hacia Lúxor.' },
          { timeTag: '08:30', title: 'Karnak', description: 'Visita guiada al complejo de Karnak.' },
          { timeTag: '10:30', title: 'Travesía del Nilo', description: 'Lancha a la orilla oeste del Nilo.' },
          { timeTag: '11:00', title: 'Valle de los Reyes', description: '3 tumbas reales con pinturas originales.' },
          { timeTag: '12:30', title: 'Almuerzo', description: 'Almuerzo tradicional junto al Nilo.' },
          { timeTag: '14:00', title: 'Templo de Hatshepsut', description: 'Templo escalonado de la faraona.' },
          { timeTag: '15:00', title: 'Regreso', description: 'Vuelta a Hurghada.' },
          { timeTag: '19:00', title: 'Llegada', description: 'Llegada al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'dolphin-house-snorkeling-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '08:30 AM', title: 'Hotel Pickup', description: 'Transfer to the departure jetty.' },
          { timeTag: '09:30 AM', title: 'Sail to Dolphin House', description: 'Cruise to Shaab el-Erg reef, home of the famous resident dolphins.' },
          { timeTag: '10:30 AM', title: 'Wild Dolphin Swim', description: 'Snorkel alongside wild spinner dolphins in their natural habitat.' },
          { timeTag: '12:00 PM', title: 'Coral Reef Snorkeling', description: 'Guided snorkeling stop at colorful reef gardens.' },
          { timeTag: '01:00 PM', title: 'Lunch Onboard', description: 'Fresh lunch and soft drinks served on deck.' },
          { timeTag: '03:00 PM', title: 'Return Transfer', description: 'Sail back and hotel drop-off.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '08:30 Uhr', title: 'Hotelabholung', description: 'Transfer zum Abfahrtssteg.' },
          { timeTag: '09:30 Uhr', title: 'Fahrt zum Dolphin House', description: 'Bootsfahrt zum Riff Shaab el-Erg.' },
          { timeTag: '10:30 Uhr', title: 'Schwimmen mit wilden Delfinen', description: 'Schnorcheln mit freilebenden Delfinen in ihrer Heimat.' },
          { timeTag: '12:00 Uhr', title: 'Korallen-Schnorcheln', description: 'Geführter Schnorchelgang an bunten Riffen.' },
          { timeTag: '13:00 Uhr', title: 'Mittagessen an Bord', description: 'Frisches Mittag mit Softdrinks.' },
          { timeTag: '15:00 Uhr', title: 'Rücktransfer', description: 'Rückfahrt und Hoteltransfer.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '08:30', title: 'Трансфер', description: 'Поездка к причалу отправления.' },
          { timeTag: '09:30', title: 'Выход к Дельфиньему Дому', description: 'Морская прогулка к рифу Шааб-эль-Эрг.' },
          { timeTag: '10:30', title: 'Плавание с дельфинами', description: 'Снорклинг с дикими дельфинами в их среде обитания.' },
          { timeTag: '12:00', title: 'Снорклинг на рифе', description: 'Плавание у красочного кораллового рифа.' },
          { timeTag: '13:00', title: 'Обед на борту', description: 'Свежий обед с напитками.' },
          { timeTag: '15:00', title: 'Возвращение', description: 'Обратно в Хургаду и трансфер в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '08:30', title: 'Prelievo in hotel', description: 'Transfer al molo di partenza.' },
          { timeTag: '09:30', title: 'Navigazione verso Dolphin House', description: 'Crociera al reef Shaab el-Erg.' },
          { timeTag: '10:30', title: 'Nuoto con delfini selvatici', description: 'Snorkeling con delfini nella loro casa naturale.' },
          { timeTag: '12:00', title: 'Snorkeling alla barriera corallina', description: 'Snorkeling guidato ai colorati giardini corallini.' },
          { timeTag: '13:00', title: 'Pranzo a bordo', description: 'Pranzo fresco con bevande.' },
          { timeTag: '15:00', title: 'Rientro', description: 'Ritorno e transfer in hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '08:30', title: 'Prise en charge', description: 'Transfer vers le ponton de départ.' },
          { timeTag: '09:30', title: 'Navigation vers Dolphin House', description: 'Croisière vers le récif Shaab el-Erg.' },
          { timeTag: '10:30', title: 'Nage avec les dauphins sauvages', description: 'Snorkeling avec les dauphins dans leur milieu naturel.' },
          { timeTag: '12:00', title: 'Snorkeling récif corallien', description: 'Plongée guidée dans les jardins coralliens colorés.' },
          { timeTag: '13:00', title: 'Déjeuner à bord', description: 'Repas frais avec boissons.' },
          { timeTag: '15:00', title: 'Retour à l\'hôtel', description: 'Retour et transfer.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '08:30', title: 'Odbiór z hotelu', description: 'Transfer do przystani.' },
          { timeTag: '09:30', title: 'Rejs do Dolphin House', description: 'Podróż do rafy Shaab el-Erg.' },
          { timeTag: '10:30', title: 'Pływanie z dzikimi delfinami', description: 'Snorkeling z dzikimi delfinami w naturalnym środowisku.' },
          { timeTag: '12:00', title: 'Snorkeling na rafie', description: 'Zwiedzanie koralowych ogrodów z przewodnikiem.' },
          { timeTag: '13:00', title: 'Obiad na pokładzie', description: 'Świeży obiad z napojami.' },
          { timeTag: '15:00', title: 'Powrót', description: 'Powrót do Hurghady i transfer do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '08:30', title: 'Recogida en el hotel', description: 'Traslado al embarcadero.' },
          { timeTag: '09:30', title: 'Navegación a Dolphin House', description: 'Crucero al arrecife Shaab el-Erg.' },
          { timeTag: '10:30', title: 'Nadar con delfines salvajes', description: 'Snorkel junto a delfines silvestres en su hábitat.' },
          { timeTag: '12:00', title: 'Snorkel en el arrecife de coral', description: 'Snorkel guiado en jardines de coral coloridos.' },
          { timeTag: '13:00', title: 'Almuerzo a bordo', description: 'Almuerzo fresco con bebidas.' },
          { timeTag: '15:00', title: 'Regreso', description: 'Vuelta y traslado al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'spa-cleopatra-bath-massage-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '10:00 AM', title: 'Welcome', description: 'Arrival at the spa and welcome consultation.' },
          { timeTag: '10:15 AM', title: 'Cleopatra Bath', description: 'Luxurious milk and honey bath, inspired by ancient Egyptian rituals.' },
          { timeTag: '10:45 AM', title: 'Body Scrub', description: 'Salt and sugar exfoliation scrub for smooth silky skin.' },
          { timeTag: '11:15 AM', title: 'Full Body Massage', description: '45-minute relaxing massage with essential oils.' },
          { timeTag: '12:00 PM', title: 'Herbal Tea & Relaxation', description: 'Wind-down in the relaxation lounge with herbal infusion.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '10:00 Uhr', title: 'Empfang', description: 'Ankunft im Spa und Beratung.' },
          { timeTag: '10:15 Uhr', title: 'Kleopatra-Bad', description: 'Luxuriöses Milch-Honig-Bad nach altägyptischem Vorbild.' },
          { timeTag: '10:45 Uhr', title: 'Körperpeeling', description: 'Salz-Zucker-Peeling für seidenzarte Haut.' },
          { timeTag: '11:15 Uhr', title: 'Ganzkörpermassage', description: '45-minütige Entspannungsmassage mit ätherischen Ölen.' },
          { timeTag: '12:00 Uhr', title: 'Kräutertee & Entspannung', description: 'Nachruhe im Entspannungsbereich.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '10:00', title: 'Приём', description: 'Прибытие в спа и консультация.' },
          { timeTag: '10:15', title: 'Ванна Клеопатры', description: 'Роскошная ванна с молоком и мёдом по рецептам Древнего Египта.' },
          { timeTag: '10:45', title: 'Пилинг тела', description: 'Скраб из соли и сахара для бархатистой кожи.' },
          { timeTag: '11:15', title: 'Массаж тела', description: '45 минут расслабляющего массажа с эфирными маслами.' },
          { timeTag: '12:00', title: 'Чай и релакс', description: 'Отдых в зоне релаксации с травяным чаем.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '10:00', title: 'Accoglienza', description: 'Arrivo alla spa e consulenza.' },
          { timeTag: '10:15', title: 'Bagno di Cleopatra', description: 'Lussuoso bagno al latte e miele secondo l\'antica tradizione egizia.' },
          { timeTag: '10:45', title: 'Scrub corporeo', description: 'Peeling con sale e zucchero per una pelle levigata.' },
          { timeTag: '11:15', title: 'Massaggio corpo', description: 'Massaggio rilassante di 45 minuti con oli essenziali.' },
          { timeTag: '12:00', title: 'Tisana e relax', description: 'Riposo nella lounge con infusione di erbe.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '10:00', title: 'Accueil', description: 'Arrivée au spa et consultation.' },
          { timeTag: '10:15', title: 'Bain de Cléopâtre', description: 'Luxueux bain au lait et miel selon la tradition égyptienne antique.' },
          { timeTag: '10:45', title: 'Gommage corporel', description: 'Exfoliation sel et sucre pour une peau soyeuse.' },
          { timeTag: '11:15', title: 'Massage corps', description: 'Massage relaxant de 45 minutes aux huiles essentielles.' },
          { timeTag: '12:00', title: 'Infusion et détente', description: 'Repos en salon de relaxation.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '10:00', title: 'Przyjazd do spa', description: 'Powitanie i konsultacja.' },
          { timeTag: '10:15', title: 'Kąpiel Kleopatry', description: 'Luksusowa kąpiel w mleku i miodzie według starożytnych receptur.' },
          { timeTag: '10:45', title: 'Peeling ciała', description: 'Scrub solno-cukrowy dla jedwabistej skóry.' },
          { timeTag: '11:15', title: 'Masaż całego ciała', description: '45-minutowy relaksujący masaż z olejkami eterycznymi.' },
          { timeTag: '12:00', title: 'Herbatka i relaks', description: 'Odpoczynek w strefie relaksu z napojem ziołowym.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '10:00', title: 'Recepción', description: 'Llegada al spa y consulta.' },
          { timeTag: '10:15', title: 'Baño de Cleopatra', description: 'Lujoso baño de leche y miel según la tradición egipcia.' },
          { timeTag: '10:45', title: 'Exfoliación corporal', description: 'Scrub de sal y azúcar para una piel suave y sedosa.' },
          { timeTag: '11:15', title: 'Masaje corporal', description: 'Masaje relajante de 45 minutos con aceites esenciales.' },
          { timeTag: '12:00', title: 'Infusión y descanso', description: 'Relax en el lounge con infusión de hierbas.' }
        ]
      }
    }
  },
  {
    slug: 'royal-safari-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '03:00 PM', title: 'Hotel Pickup', description: 'Transfer to the Royal Safari departure point in the desert.' },
          { timeTag: '03:30 PM', title: 'Buggy / ATV Ride', description: 'Exhilarating ride on buggies through dramatic desert dunes.' },
          { timeTag: '04:30 PM', title: 'Camel Ride', description: 'Traditional camel ride at sunset over the desert terrain.' },
          { timeTag: '05:00 PM', title: 'Bedouin Village', description: 'Welcome tea, henna painting, and shisha at a Bedouin camp.' },
          { timeTag: '06:30 PM', title: 'Bedouin Dinner & Show', description: 'Traditional dinner with live Bedouin music and dance performance.' },
          { timeTag: '08:30 PM', title: 'Return Transfer', description: 'Drop-off at your Hurghada hotel.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '15:00 Uhr', title: 'Abholung', description: 'Transfer zum Ausgangspunkt in der Wüste.' },
          { timeTag: '15:30 Uhr', title: 'Buggy/ATV-Tour', description: 'Aufregende Fahrt durch spektakuläre Dünenlandschaft.' },
          { timeTag: '16:30 Uhr', title: 'Kamelritt', description: 'Traditioneller Kamelritt beim Sonnenuntergang.' },
          { timeTag: '17:00 Uhr', title: 'Beduinendorf', description: 'Tee, Henna-Bemalung und Shisha im Lager.' },
          { timeTag: '18:30 Uhr', title: 'Abendessen & Show', description: 'Traditionelles Abendessen mit Beduinenmusik.' },
          { timeTag: '20:30 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '15:00', title: 'Трансфер', description: 'Поездка к стартовой точке Королевского сафари.' },
          { timeTag: '15:30', title: 'Багги/квадроцикл', description: 'Захватывающая поездка по дюнам пустыни.' },
          { timeTag: '16:30', title: 'Катание на верблюде', description: 'Верблюжья прогулка на закате.' },
          { timeTag: '17:00', title: 'Бедуинская деревня', description: 'Чай, хна и кальян в бедуинском лагере.' },
          { timeTag: '18:30', title: 'Ужин и шоу', description: 'Традиционный ужин с живой музыкой и танцами.' },
          { timeTag: '20:30', title: 'Возвращение', description: 'Трансфер обратно в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '15:00', title: 'Prelievo', description: 'Transfer al punto di partenza del safari.' },
          { timeTag: '15:30', title: 'Buggy/ATV', description: 'Emozionante giro tra le dune del deserto.' },
          { timeTag: '16:30', title: 'Giro in cammello', description: 'Passeggiata in cammello al tramonto.' },
          { timeTag: '17:00', title: 'Villaggio beduino', description: 'Tè, henné e narghilè al campo beduino.' },
          { timeTag: '18:30', title: 'Cena e spettacolo', description: 'Cena tradizionale con musica e danza dal vivo.' },
          { timeTag: '20:30', title: 'Rientro', description: 'Transfer di ritorno in hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '15:00', title: 'Prise en charge', description: 'Transfer vers le point de départ du safari.' },
          { timeTag: '15:30', title: 'Buggy/ATV', description: 'Aventure en buggy dans les dunes du désert.' },
          { timeTag: '16:30', title: 'Balade chameau', description: 'Promenade à chameau au coucher du soleil.' },
          { timeTag: '17:00', title: 'Village bédouin', description: 'Thé, henné et chicha au campement bédouin.' },
          { timeTag: '18:30', title: 'Dîner et spectacle', description: 'Repas traditionnel avec musique et danse live.' },
          { timeTag: '20:30', title: 'Retour à l\'hôtel', description: 'Transfer retour.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '15:00', title: 'Odbiór', description: 'Transfer do punktu startowego safari.' },
          { timeTag: '15:30', title: 'Buggy/ATV', description: 'Ekscytująca przejażdżka po wydmach pustynnych.' },
          { timeTag: '16:30', title: 'Jazda na wielbłądzie', description: 'Tradycyjna przejażdżka wielbłądem o zachodzie słońca.' },
          { timeTag: '17:00', title: 'Wioska beduińska', description: 'Herbata, henna i shisha w obozie beduińskim.' },
          { timeTag: '18:30', title: 'Kolacja i pokaz', description: 'Tradycyjna kolacja z muzyką i tańcami na żywo.' },
          { timeTag: '20:30', title: 'Powrót', description: 'Transfer powrotny do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '15:00', title: 'Recogida', description: 'Traslado al punto de partida del safari.' },
          { timeTag: '15:30', title: 'Buggy/ATV', description: 'Emocionante recorrido en buggy por las dunas.' },
          { timeTag: '16:30', title: 'Paseo en camello', description: 'Recorrido en camello al atardecer.' },
          { timeTag: '17:00', title: 'Aldea beduina', description: 'Té, henna y shisha en el campamento beduino.' },
          { timeTag: '18:30', title: 'Cena y espectáculo', description: 'Cena tradicional con música y danza en vivo.' },
          { timeTag: '20:30', title: 'Regreso', description: 'Transfer de vuelta al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'cairo-gem-pyramids-day-trip',
    translations: {
      en: {
        itinerary: [
          { timeTag: '01:00 AM', title: 'Hotel Pickup', description: 'Overnight coach journey from Hurghada to Cairo.' },
          { timeTag: '08:00 AM', title: 'Grand Egyptian Museum (GEM)', description: 'Explore the world\'s largest archaeological museum with 100,000+ artifacts including Tutankhamun\'s golden mask.' },
          { timeTag: '11:00 AM', title: 'Papyrus & Oils Demo', description: 'Visit a papyrus institute and essential oils workshop.' },
          { timeTag: '12:30 PM', title: 'Buffet Lunch', description: 'Traditional Egyptian buffet lunch at a local restaurant.' },
          { timeTag: '02:00 PM', title: 'Pyramids of Giza & Sphinx', description: 'Guided tour of the Three Great Pyramids and the enigmatic Great Sphinx.' },
          { timeTag: '04:30 PM', title: 'Panoramic Viewpoint', description: 'Desert plateau photo opportunity overlooking all three pyramids.' },
          { timeTag: '06:00 PM', title: 'Departure for Hurghada', description: 'Board the coach back to Hurghada.' },
          { timeTag: '01:00 AM', title: 'Hotel Drop-off', description: 'Arrive back at your Hurghada resort.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '01:00 Uhr', title: 'Hotelabholung', description: 'Nachtfahrt im Reisebus von Hurghada nach Kairo.' },
          { timeTag: '08:00 Uhr', title: 'Grand Ägyptisches Museum (GEM)', description: 'Führung durch das weltgrößte archäologische Museum.' },
          { timeTag: '11:00 Uhr', title: 'Papyrus & Öle', description: 'Besuch eines Papyrusinstituts und Parfümerie.' },
          { timeTag: '12:30 Uhr', title: 'Mittagessen', description: 'Ägyptisches Buffet in einem lokalen Restaurant.' },
          { timeTag: '14:00 Uhr', title: 'Pyramiden & Sphinx', description: 'Führung rund um die Großen Pyramiden und Sphinx.' },
          { timeTag: '16:30 Uhr', title: 'Panoramablick', description: 'Fotostopp auf dem Wüstenplateau.' },
          { timeTag: '18:00 Uhr', title: 'Abfahrt', description: 'Rückfahrt nach Hurghada.' },
          { timeTag: '01:00 Uhr', title: 'Ankunft', description: 'Ankunft im Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '01:00', title: 'Выезд из отеля', description: 'Ночная поездка на автобусе из Хургады в Каир.' },
          { timeTag: '08:00', title: 'Большой Египетский музей (GEM)', description: 'Экскурсия по крупнейшему в мире археологическому музею.' },
          { timeTag: '11:00', title: 'Папирус и эфирные масла', description: 'Визит в институт папируса и парфюмерный магазин.' },
          { timeTag: '12:30', title: 'Обед', description: 'Шведский стол египетской кухни в местном ресторане.' },
          { timeTag: '14:00', title: 'Пирамиды и Сфинкс', description: 'Экскурсия к Великим пирамидам и Большому Сфинксу.' },
          { timeTag: '16:30', title: 'Смотровая площадка', description: 'Панорамные фото всех трёх пирамид.' },
          { timeTag: '18:00', title: 'Выезд', description: 'Возвращение в Хургаду.' },
          { timeTag: '01:00', title: 'Прибытие', description: 'Возвращение в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '01:00', title: 'Partenza', description: 'Viaggio notturno in pullman da Hurghada a Il Cairo.' },
          { timeTag: '08:00', title: 'Grand Egyptian Museum (GEM)', description: 'Tour del più grande museo archeologico del mondo.' },
          { timeTag: '11:00', title: 'Papiro e oli essenziali', description: 'Visita a un istituto del papiro e laboratorio di profumi.' },
          { timeTag: '12:30', title: 'Pranzo a buffet', description: 'Pranzo egiziano in ristorante locale.' },
          { timeTag: '14:00', title: 'Piramidi e Sfinge', description: 'Tour guidato alle tre grandi piramidi e alla Sfinge.' },
          { timeTag: '16:30', title: 'Punto panoramico', description: 'Foto panoramiche dal plateau del deserto.' },
          { timeTag: '18:00', title: 'Partenza', description: 'Ritorno verso Hurghada.' },
          { timeTag: '01:00', title: 'Arrivo in hotel', description: 'Rientro al resort.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '01:00', title: 'Départ', description: 'Trajet nocturne en bus de Hurghada vers Le Caire.' },
          { timeTag: '08:00', title: 'Grand Musée Égyptien (GEM)', description: 'Visite du plus grand musée archéologique au monde.' },
          { timeTag: '11:00', title: 'Papyrus et huiles essentielles', description: 'Visite d\'un institut papyrus et atelier parfumerie.' },
          { timeTag: '12:30', title: 'Déjeuner buffet', description: 'Repas égyptien dans un restaurant local.' },
          { timeTag: '14:00', title: 'Pyramides et Sphinx', description: 'Visite guidée des trois grandes pyramides et du Sphinx.' },
          { timeTag: '16:30', title: 'Point de vue panoramique', description: 'Photos panoramiques sur le plateau de sable.' },
          { timeTag: '18:00', title: 'Départ', description: 'Retour vers Hurghada.' },
          { timeTag: '01:00', title: 'Arrivée', description: 'Retour à l\'hôtel.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '01:00', title: 'Wyjazd', description: 'Nocna podróż autokarem z Hurghady do Kairu.' },
          { timeTag: '08:00', title: 'Wielkie Muzeum Egipskie (GEM)', description: 'Zwiedzanie największego muzeum archeologicznego na świecie.' },
          { timeTag: '11:00', title: 'Papirus i olejki', description: 'Wizyta w instytucie papirusu i pracowni perfum.' },
          { timeTag: '12:30', title: 'Obiad bufet', description: 'Egipski obiad w lokalnej restauracji.' },
          { timeTag: '14:00', title: 'Piramidy i Sfinks', description: 'Zwiedzanie trzech piramid i Sfinksa.' },
          { timeTag: '16:30', title: 'Punkt widokowy', description: 'Panoramiczne zdjęcia z pustyni.' },
          { timeTag: '18:00', title: 'Wyjazd', description: 'Powrót do Hurghady.' },
          { timeTag: '01:00', title: 'Przyjazd', description: 'Powrót do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '01:00', title: 'Salida', description: 'Viaje nocturno en autobús desde Hurghada hasta El Cairo.' },
          { timeTag: '08:00', title: 'Gran Museo Egipcio (GEM)', description: 'Visita al mayor museo arqueológico del mundo.' },
          { timeTag: '11:00', title: 'Papiro y aceites esenciales', description: 'Visita a un instituto de papiro y taller de perfumes.' },
          { timeTag: '12:30', title: 'Almuerzo buffet', description: 'Almuerzo egipcio en restaurante local.' },
          { timeTag: '14:00', title: 'Pirámides y Esfinge', description: 'Tour guiado por las tres pirámides y la Esfinge.' },
          { timeTag: '16:30', title: 'Mirador panorámico', description: 'Fotos panorámicas desde la meseta del desierto.' },
          { timeTag: '18:00', title: 'Salida de regreso', description: 'Vuelta hacia Hurghada.' },
          { timeTag: '01:00', title: 'Llegada', description: 'Regreso al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'diving-trip-red-sea-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '08:00 AM', title: 'Hotel Pickup', description: 'Transfer to Hurghada dive center and marina.' },
          { timeTag: '09:00 AM', title: 'Dive Briefing & Equipment Check', description: 'Safety briefing and gear fitting with PADI-certified instructor.' },
          { timeTag: '09:30 AM', title: 'First Dive', description: 'Descent to 12-18m at spectacular coral reef wall.' },
          { timeTag: '11:00 AM', title: 'Surface Interval', description: 'Rest onboard with refreshments between dives.' },
          { timeTag: '11:30 AM', title: 'Second Dive', description: 'Explore a different reef site with your dive guide.' },
          { timeTag: '01:00 PM', title: 'Lunch Onboard', description: 'Hot lunch served on the dive boat.' },
          { timeTag: '02:30 PM', title: 'Optional Third Dive', description: 'Additional dive for certified divers (supplement applies).' },
          { timeTag: '04:00 PM', title: 'Return Transfer', description: 'Dock at marina and hotel drop-off.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '08:00 Uhr', title: 'Hotelabholung', description: 'Transfer zum Tauchzentrum und Marina.' },
          { timeTag: '09:00 Uhr', title: 'Briefing & Ausrüstung', description: 'Sicherheitseinweisung und Ausrüstungsprüfung.' },
          { timeTag: '09:30 Uhr', title: 'Erster Tauchgang', description: 'Abtauchen bis 12-18m an Korallenriffen.' },
          { timeTag: '11:00 Uhr', title: 'Pause an Bord', description: 'Erholung zwischen den Tauchgängen mit Erfrischungen.' },
          { timeTag: '11:30 Uhr', title: 'Zweiter Tauchgang', description: 'Zweiter Riff-Standort mit Tauchguide.' },
          { timeTag: '13:00 Uhr', title: 'Mittagessen', description: 'Warme Mahlzeit an Bord.' },
          { timeTag: '14:30 Uhr', title: 'Optionaler dritter Tauchgang', description: 'Für erfahrene Taucher (Aufpreis).' },
          { timeTag: '16:00 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '08:00', title: 'Трансфер', description: 'Поездка в дайвинг-центр и марину Хургады.' },
          { timeTag: '09:00', title: 'Инструктаж и оборудование', description: 'Briefing по безопасности и подбор снаряжения.' },
          { timeTag: '09:30', title: 'Первое погружение', description: 'Спуск на 12-18 м у кораллового рифа.' },
          { timeTag: '11:00', title: 'Перерыв на борту', description: 'Отдых с напитками между погружениями.' },
          { timeTag: '11:30', title: 'Второе погружение', description: 'Исследование второго рифа с дайв-гидом.' },
          { timeTag: '13:00', title: 'Обед на борту', description: 'Горячий обед на дайв-боте.' },
          { timeTag: '14:30', title: 'Третье погружение (по желанию)', description: 'Дополнительное погружение для сертифицированных дайверов.' },
          { timeTag: '16:00', title: 'Возвращение', description: 'Возвращение в марину и трансфер в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '08:00', title: 'Prelievo in hotel', description: 'Transfer al centro immersioni e alla marina.' },
          { timeTag: '09:00', title: 'Briefing e attrezzatura', description: 'Briefing sicurezza e preparazione dell\'attrezzatura.' },
          { timeTag: '09:30', title: 'Prima immersione', description: 'Discesa fino a 12-18m sulle pareti coralline.' },
          { timeTag: '11:00', title: 'Pausa a bordo', description: 'Riposo con rinfreschi tra le immersioni.' },
          { timeTag: '11:30', title: 'Seconda immersione', description: 'Esplorazione di un secondo sito con la guida.' },
          { timeTag: '13:00', title: 'Pranzo a bordo', description: 'Pasto caldo sul barcone da immersione.' },
          { timeTag: '14:30', title: 'Terza immersione (opzionale)', description: 'Per subacquei certificati (supplemento applicato).' },
          { timeTag: '16:00', title: 'Rientro', description: 'Ritorno alla marina e transfer hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '08:00', title: 'Prise en charge', description: 'Transfer vers le centre de plongée et la marina.' },
          { timeTag: '09:00', title: 'Briefing et équipement', description: 'Consignes de sécurité et préparation de l\'équipement.' },
          { timeTag: '09:30', title: 'Première plongée', description: 'Descente à 12-18m sur les parois récifales.' },
          { timeTag: '11:00', title: 'Pause à bord', description: 'Repos avec rafraîchissements entre les plongées.' },
          { timeTag: '11:30', title: 'Deuxième plongée', description: 'Exploration d\'un second site avec le guide.' },
          { timeTag: '13:00', title: 'Déjeuner à bord', description: 'Repas chaud sur le bateau de plongée.' },
          { timeTag: '14:30', title: 'Troisième plongée (optionnelle)', description: 'Pour plongeurs certifiés (supplément applicable).' },
          { timeTag: '16:00', title: 'Retour à l\'hôtel', description: 'Retour à la marina et transfer.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '08:00', title: 'Odbiór z hotelu', description: 'Transfer do centrum nurkowego i mariny.' },
          { timeTag: '09:00', title: 'Briefing i sprzęt', description: 'Instrukcja bezpieczeństwa i przygotowanie sprzętu.' },
          { timeTag: '09:30', title: 'Pierwsze nurkowanie', description: 'Zejście na 12-18m przy ścianie koralowej.' },
          { timeTag: '11:00', title: 'Przerwa na pokładzie', description: 'Odpoczynek z napojami między nurkowaniami.' },
          { timeTag: '11:30', title: 'Drugie nurkowanie', description: 'Eksploracja drugiej lokalizacji z przewodnikiem.' },
          { timeTag: '13:00', title: 'Obiad na pokładzie', description: 'Ciepły posiłek na łodzi nurkowej.' },
          { timeTag: '14:30', title: 'Trzecie nurkowanie (opcjonalne)', description: 'Dla certyfikowanych nurków (dopłata).' },
          { timeTag: '16:00', title: 'Powrót', description: 'Powrót do mariny i transfer do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '08:00', title: 'Recogida en el hotel', description: 'Traslado al centro de buceo y la marina.' },
          { timeTag: '09:00', title: 'Briefing y equipo', description: 'Instrucciones de seguridad y preparación del equipo.' },
          { timeTag: '09:30', title: 'Primera inmersión', description: 'Descenso a 12-18m en la pared de coral.' },
          { timeTag: '11:00', title: 'Pausa a bordo', description: 'Descanso con refrescos entre inmersiones.' },
          { timeTag: '11:30', title: 'Segunda inmersión', description: 'Exploración de un segundo sitio con el guía.' },
          { timeTag: '13:00', title: 'Almuerzo a bordo', description: 'Comida caliente en el barco de buceo.' },
          { timeTag: '14:30', title: 'Tercera inmersión (opcional)', description: 'Para buceadores certificados (suplemento aplicado).' },
          { timeTag: '16:00', title: 'Regreso', description: 'Vuelta a la marina y traslado al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'luxor-valley-queens-day-trip',
    translations: {
      en: {
        itinerary: [
          { timeTag: '04:30 AM', title: 'Hotel Pickup', description: 'Early departure from Hurghada hotel.' },
          { timeTag: '09:00 AM', title: 'Valley of the Queens', description: 'Enter beautifully decorated tombs of royal wives and princes.' },
          { timeTag: '10:30 AM', title: 'Medinet Habu Temple', description: 'Guided tour of the mortuary temple of Ramesses III.' },
          { timeTag: '12:00 PM', title: 'Lunch', description: 'Traditional lunch at a Nile-side restaurant.' },
          { timeTag: '01:30 PM', title: 'Deir el-Medina', description: 'Visit the village and tombs of the ancient craftsmen who built the royal tombs.' },
          { timeTag: '03:00 PM', title: 'Colossi of Memnon', description: 'Photo stop at the towering twin statues.' },
          { timeTag: '03:30 PM', title: 'Return Drive', description: 'Head back to Hurghada.' },
          { timeTag: '08:00 PM', title: 'Hotel Drop-off', description: 'Arrive at your resort.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '04:30 Uhr', title: 'Abholung', description: 'Frühe Abfahrt aus Hurghada.' },
          { timeTag: '09:00 Uhr', title: 'Tal der Königinnen', description: 'Besuch prachtvoll dekorierter Gräber.' },
          { timeTag: '10:30 Uhr', title: 'Medinet-Habu-Tempel', description: 'Grabtempel Ramses III. mit Führung.' },
          { timeTag: '12:00 Uhr', title: 'Mittagessen', description: 'Traditionelles Essen am Nilrestaurant.' },
          { timeTag: '13:30 Uhr', title: 'Deir el-Medina', description: 'Handwerkerdorf und Gräber der Erbauer der Königsgräber.' },
          { timeTag: '15:00 Uhr', title: 'Memnonkolosse', description: 'Fotostopp an den riesigen Statuen.' },
          { timeTag: '15:30 Uhr', title: 'Rückfahrt', description: 'Rückreise nach Hurghada.' },
          { timeTag: '20:00 Uhr', title: 'Ankunft', description: 'Ankunft im Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '04:30', title: 'Выезд', description: 'Ранний выезд из Хургады.' },
          { timeTag: '09:00', title: 'Долина Цариц', description: 'Гробницы цариц и принцев с изысканными росписями.' },
          { timeTag: '10:30', title: 'Храм Мединет-Абу', description: 'Заупокойный храм Рамсеса III с гидом.' },
          { timeTag: '12:00', title: 'Обед', description: 'Традиционный обед в ресторане у Нила.' },
          { timeTag: '13:30', title: 'Дейр эль-Медина', description: 'Деревня и гробницы строителей царских гробниц.' },
          { timeTag: '15:00', title: 'Колоссы Мемнона', description: 'Фотостоп у гигантских статуй.' },
          { timeTag: '15:30', title: 'Обратный путь', description: 'Возвращение в Хургаду.' },
          { timeTag: '20:00', title: 'Прибытие', description: 'Возвращение в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '04:30', title: 'Partenza', description: 'Partenza mattutina da Hurghada.' },
          { timeTag: '09:00', title: 'Valle delle Regine', description: 'Tombe di regine e principi, riccamente decorate.' },
          { timeTag: '10:30', title: 'Tempio di Medinet Habu', description: 'Tempio funerario di Ramesse III con guida.' },
          { timeTag: '12:00', title: 'Pranzo', description: 'Pranzo tradizionale in ristorante sul Nilo.' },
          { timeTag: '13:30', title: 'Deir el-Medina', description: 'Villaggio e tombe degli artigiani costruttori.' },
          { timeTag: '15:00', title: 'Colossi di Memnone', description: 'Sosta fotografica alle imponenti statue.' },
          { timeTag: '15:30', title: 'Rientro', description: 'Ritorno verso Hurghada.' },
          { timeTag: '20:00', title: 'Arrivo in hotel', description: 'Rientro al resort.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '04:30', title: 'Départ', description: 'Départ matinal de Hurghada.' },
          { timeTag: '09:00', title: 'Vallée des Reines', description: 'Tombes décorées des épouses et princes royaux.' },
          { timeTag: '10:30', title: 'Temple de Médinet Habou', description: 'Temple funéraire de Ramsès III avec guide.' },
          { timeTag: '12:00', title: 'Déjeuner', description: 'Repas traditionnel en bord du Nil.' },
          { timeTag: '13:30', title: 'Deir el-Medina', description: 'Village et tombes des artisans bâtisseurs.' },
          { timeTag: '15:00', title: 'Colosses de Memnon', description: 'Arrêt photo aux statues colossales.' },
          { timeTag: '15:30', title: 'Retour', description: 'Retour vers Hurghada.' },
          { timeTag: '20:00', title: 'Arrivée', description: 'Arrivée à l\'hôtel.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '04:30', title: 'Wyjazd', description: 'Wczesny wyjazd z Hurghady.' },
          { timeTag: '09:00', title: 'Dolina Królowych', description: 'Grobowce królowych i książąt z pięknymi malowidłami.' },
          { timeTag: '10:30', title: 'Świątynia Medinet Habu', description: 'Grobowy świątynia Ramzesa III z przewodnikiem.' },
          { timeTag: '12:00', title: 'Obiad', description: 'Tradycyjny obiad w restauracji nad Nilem.' },
          { timeTag: '13:30', title: 'Deir el-Medina', description: 'Wioska i grobowce starożytnych rzemieślników.' },
          { timeTag: '15:00', title: 'Kolosy Memnona', description: 'Przystanek fotograficzny przy posągach.' },
          { timeTag: '15:30', title: 'Powrót', description: 'Powrót do Hurghady.' },
          { timeTag: '20:00', title: 'Przyjazd', description: 'Przyjazd do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '04:30', title: 'Salida', description: 'Salida temprana desde Hurghada.' },
          { timeTag: '09:00', title: 'Valle de las Reinas', description: 'Tumbas ricamente decoradas de esposas y príncipes reales.' },
          { timeTag: '10:30', title: 'Templo de Medinet Habu', description: 'Templo funerario de Ramsés III con guía.' },
          { timeTag: '12:00', title: 'Almuerzo', description: 'Comida tradicional junto al Nilo.' },
          { timeTag: '13:30', title: 'Deir el-Medina', description: 'Aldea y tumbas de los artesanos constructores.' },
          { timeTag: '15:00', title: 'Colosos de Memnón', description: 'Parada fotográfica en las estatuas colosales.' },
          { timeTag: '15:30', title: 'Regreso', description: 'Vuelta hacia Hurghada.' },
          { timeTag: '20:00', title: 'Llegada', description: 'Llegada al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'cairo-tahrir-museum-pyramids',
    translations: {
      en: {
        itinerary: [
          { timeTag: '01:30 AM', title: 'Hotel Pickup', description: 'Night coach from Hurghada to Cairo.' },
          { timeTag: '08:30 AM', title: 'Tahrir Square & Egyptian Museum', description: 'Walk Tahrir Square and enter the iconic Egyptian Museum — home of Tutankhamun\'s golden treasures.' },
          { timeTag: '11:00 AM', title: 'Local Bazaar', description: 'Optional visit to a spice and souvenir market near the museum.' },
          { timeTag: '12:30 PM', title: 'Buffet Lunch', description: 'Oriental buffet lunch at local restaurant.' },
          { timeTag: '02:00 PM', title: 'Pyramids of Giza', description: 'Guided tour of Khufu, Khafre, and Menkaure pyramids plus the Great Sphinx.' },
          { timeTag: '05:00 PM', title: 'Depart Cairo', description: 'Board the coach for Hurghada.' },
          { timeTag: '11:30 PM', title: 'Hotel Drop-off', description: 'Arrive back at your Hurghada resort.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '01:30 Uhr', title: 'Hotelabholung', description: 'Nachtbus von Hurghada nach Kairo.' },
          { timeTag: '08:30 Uhr', title: 'Tahrir-Platz & Museum', description: 'Spaziergang am Tahrir-Platz und Besuch des Ägyptischen Museums.' },
          { timeTag: '11:00 Uhr', title: 'Basar', description: 'Optionaler Besuch eines Gewürzmarkts.' },
          { timeTag: '12:30 Uhr', title: 'Mittagessen', description: 'Orientalisches Buffet in einem Lokal.' },
          { timeTag: '14:00 Uhr', title: 'Pyramiden von Gizeh', description: 'Geführte Tour zu den drei Pyramiden und Sphinx.' },
          { timeTag: '17:00 Uhr', title: 'Abfahrt', description: 'Rückfahrt nach Hurghada.' },
          { timeTag: '23:30 Uhr', title: 'Ankunft', description: 'Rückkehr ins Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '01:30', title: 'Выезд из отеля', description: 'Ночной автобус из Хургады в Каир.' },
          { timeTag: '08:30', title: 'Площадь Тахрир и Египетский музей', description: 'Прогулка по площади Тахрир и экскурсия в знаменитый музей.' },
          { timeTag: '11:00', title: 'Базар', description: 'Посещение рынка специй и сувениров (по желанию).' },
          { timeTag: '12:30', title: 'Обед', description: 'Шведский стол восточной кухни в местном ресторане.' },
          { timeTag: '14:00', title: 'Пирамиды Гизы', description: 'Экскурсия к пирамидам Хеопса, Хефрена, Микерина и Сфинксу.' },
          { timeTag: '17:00', title: 'Выезд', description: 'Обратно в Хургаду.' },
          { timeTag: '23:30', title: 'Прибытие', description: 'Возвращение в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '01:30', title: 'Partenza', description: 'Autobus notturno da Hurghada al Cairo.' },
          { timeTag: '08:30', title: 'Piazza Tahrir e Museo Egizio', description: 'Passeggiata in Piazza Tahrir e visita al celebre Museo Egizio.' },
          { timeTag: '11:00', title: 'Bazar locale', description: 'Visita opzionale al mercato delle spezie.' },
          { timeTag: '12:30', title: 'Pranzo a buffet', description: 'Buffet orientale in ristorante locale.' },
          { timeTag: '14:00', title: 'Piramidi di Giza', description: 'Tour guidato alle tre piramidi e alla Sfinge.' },
          { timeTag: '17:00', title: 'Partenza per Hurghada', description: 'Ritorno in pullman.' },
          { timeTag: '23:30', title: 'Arrivo in hotel', description: 'Rientro al resort.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '01:30', title: 'Départ', description: 'Bus nocturne de Hurghada au Caire.' },
          { timeTag: '08:30', title: 'Place Tahrir et Musée Égyptien', description: 'Promenade sur Tahrir et visite du célèbre musée.' },
          { timeTag: '11:00', title: 'Bazar local', description: 'Marché aux épices en option.' },
          { timeTag: '12:30', title: 'Déjeuner buffet', description: 'Buffet oriental dans un restaurant local.' },
          { timeTag: '14:00', title: 'Pyramides de Gizeh', description: 'Visite guidée des trois pyramides et du Sphinx.' },
          { timeTag: '17:00', title: 'Départ', description: 'Retour vers Hurghada en bus.' },
          { timeTag: '23:30', title: 'Arrivée', description: 'Arrivée à l\'hôtel.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '01:30', title: 'Wyjazd', description: 'Autokar nocny z Hurghady do Kairu.' },
          { timeTag: '08:30', title: 'Plac Tahrir i Muzeum Egipskie', description: 'Spacer po placu Tahrir i zwiedzanie słynnego muzeum.' },
          { timeTag: '11:00', title: 'Lokalny bazar', description: 'Opcjonalna wizyta na targu przypraw.' },
          { timeTag: '12:30', title: 'Obiad bufet', description: 'Orientalny bufet w lokalnej restauracji.' },
          { timeTag: '14:00', title: 'Piramidy w Gizie', description: 'Zwiedzanie trzech piramid i Sfinksa.' },
          { timeTag: '17:00', title: 'Odjazd', description: 'Powrót do Hurghady autokarem.' },
          { timeTag: '23:30', title: 'Przyjazd', description: 'Powrót do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '01:30', title: 'Salida', description: 'Autobús nocturno desde Hurghada hacia El Cairo.' },
          { timeTag: '08:30', title: 'Plaza Tahrir y Museo Egipcio', description: 'Paseo por Tahrir y visita al famoso museo.' },
          { timeTag: '11:00', title: 'Bazar local', description: 'Visita opcional al mercado de especias.' },
          { timeTag: '12:30', title: 'Almuerzo buffet', description: 'Buffet oriental en restaurante local.' },
          { timeTag: '14:00', title: 'Pirámides de Guiza', description: 'Tour guiado por las tres pirámides y la Esfinge.' },
          { timeTag: '17:00', title: 'Salida de El Cairo', description: 'Regreso en autobús a Hurghada.' },
          { timeTag: '23:30', title: 'Llegada', description: 'Llegada al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'semi-submarine-batiskaf-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '09:00 AM', title: 'Hotel Pickup', description: 'Transfer to Hurghada marina.' },
          { timeTag: '10:00 AM', title: 'Board the Semi-Submarine', description: 'Step aboard the unique glass-hulled semi-submarine vessel.' },
          { timeTag: '10:15 AM', title: 'Coral Reef Viewing', description: '45-minute underwater viewing of coral formations, fish, and marine life through large windows.' },
          { timeTag: '11:00 AM', title: 'Snorkeling (Optional)', description: 'Optional snorkeling stop at the reef from the boat.' },
          { timeTag: '12:00 PM', title: 'Return to Marina', description: 'Dock and hotel transfer.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '09:00 Uhr', title: 'Hotelabholung', description: 'Transfer zur Marina Hurghada.' },
          { timeTag: '10:00 Uhr', title: 'Einsteigen ins Semi-U-Boot', description: 'Bestieg das einzigartige Glasbodenboot.' },
          { timeTag: '10:15 Uhr', title: 'Korallenriff-Beobachtung', description: '45-minütige Unterwasserbeobachtung durch große Fenster.' },
          { timeTag: '11:00 Uhr', title: 'Schnorcheln (optional)', description: 'Optionaler Schnorchelgang vom Boot aus.' },
          { timeTag: '12:00 Uhr', title: 'Rückkehr', description: 'Rückfahrt und Hoteltransfer.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '09:00', title: 'Трансфер', description: 'Поездка в марину Хургады.' },
          { timeTag: '10:00', title: 'Посадка на полупогружную лодку', description: 'Посадка на уникальное судно с прозрачным дном.' },
          { timeTag: '10:15', title: 'Наблюдение за рифом', description: '45 минут обзора морского мира через панорамные окна.' },
          { timeTag: '11:00', title: 'Снорклинг (по желанию)', description: 'Опциональная остановка для снорклинга у рифа.' },
          { timeTag: '12:00', title: 'Возвращение', description: 'Возвращение в марину и трансфер в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '09:00', title: 'Prelievo in hotel', description: 'Transfer alla marina di Hurghada.' },
          { timeTag: '10:00', title: 'Imbarco sul semi-sottomarino', description: 'Salire sull\'unico natante con scafo in vetro.' },
          { timeTag: '10:15', title: 'Osservazione della barriera corallina', description: '45 minuti di osservazione subacquea attraverso grandi finestre.' },
          { timeTag: '11:00', title: 'Snorkeling (opzionale)', description: 'Sosta snorkeling opzionale dal natante.' },
          { timeTag: '12:00', title: 'Ritorno', description: 'Ritorno alla marina e transfer hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '09:00', title: 'Prise en charge', description: 'Transfer vers la marina de Hurghada.' },
          { timeTag: '10:00', title: 'Montée à bord', description: 'Embarquement sur le semi-sous-marin à fond de verre.' },
          { timeTag: '10:15', title: 'Observation des coraux', description: '45 minutes de vue sous-marine par grandes fenêtres.' },
          { timeTag: '11:00', title: 'Snorkeling (optionnel)', description: 'Session snorkeling optionnelle au récif.' },
          { timeTag: '12:00', title: 'Retour', description: 'Retour au port et transfer hôtel.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '09:00', title: 'Odbiór z hotelu', description: 'Transfer do mariny w Hurghadzie.' },
          { timeTag: '10:00', title: 'Wejście na łódź', description: 'Wejście na unikalną łódź z przezroczystym dnem.' },
          { timeTag: '10:15', title: 'Obserwacja rafy', description: '45 minut oglądania podwodnego świata przez duże okna.' },
          { timeTag: '11:00', title: 'Snorkeling (opcja)', description: 'Opcjonalny przystanek do snorkelingu przy rafie.' },
          { timeTag: '12:00', title: 'Powrót', description: 'Powrót do mariny i transfer do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '09:00', title: 'Recogida en el hotel', description: 'Traslado al puerto de Hurghada.' },
          { timeTag: '10:00', title: 'Embarque', description: 'Subida al único barco con casco de cristal.' },
          { timeTag: '10:15', title: 'Observación del arrecife', description: '45 minutos de vista submarina por grandes ventanas.' },
          { timeTag: '11:00', title: 'Snorkel (opcional)', description: 'Parada opcional de snorkel en el arrecife.' },
          { timeTag: '12:00', title: 'Regreso', description: 'Vuelta al puerto y traslado al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'spa-turkish-bath-massage-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '10:00 AM', title: 'Arrival & Welcome', description: 'Arrive at the spa and change into robe.' },
          { timeTag: '10:15 AM', title: 'Steam Room', description: 'Relax in the traditional steam room to open pores.' },
          { timeTag: '10:30 AM', title: 'Turkish Hammam Scrub', description: 'Exfoliating kese scrub with goat hair mitt on the heated marble slab.' },
          { timeTag: '11:00 AM', title: 'Foam Massage', description: 'Traditional full-body foam massage on the marble stone.' },
          { timeTag: '11:30 AM', title: 'Oil Massage', description: '30-minute relaxing aromatic oil massage.' },
          { timeTag: '12:00 PM', title: 'Cool-Down & Tea', description: 'Refreshment time with cold water and herbal tea in the relaxation area.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '10:00 Uhr', title: 'Empfang', description: 'Ankunft und Umkleiden im Bademantel.' },
          { timeTag: '10:15 Uhr', title: 'Dampfbad', description: 'Entspannung im traditionellen Dampfbad.' },
          { timeTag: '10:30 Uhr', title: 'Hammam-Peeling', description: 'Körperpeeling mit Seifenschaum auf erhitztem Marmorstein.' },
          { timeTag: '11:00 Uhr', title: 'Schaummassage', description: 'Traditionelle Schaummassage am Marmorstein.' },
          { timeTag: '11:30 Uhr', title: 'Ölmassage', description: '30-minütige Aromamassage.' },
          { timeTag: '12:00 Uhr', title: 'Kühlung & Tee', description: 'Abschluss mit Kräutertee im Entspannungsbereich.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '10:00', title: 'Приём', description: 'Прибытие в спа и переодевание.' },
          { timeTag: '10:15', title: 'Паровая баня', description: 'Расслабление в традиционной паровой комнате.' },
          { timeTag: '10:30', title: 'Скраб в хаммаме', description: 'Жёсткий пилинг кесе на разогретом мраморе.' },
          { timeTag: '11:00', title: 'Пенный массаж', description: 'Традиционный массаж с мыльной пеной на мраморе.' },
          { timeTag: '11:30', title: 'Масляный массаж', description: '30 минут ароматного расслабляющего массажа.' },
          { timeTag: '12:00', title: 'Охлаждение и чай', description: 'Завершение с холодной водой и травяным чаем.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '10:00', title: 'Accoglienza', description: 'Arrivo alla spa e cambio in accappatoio.' },
          { timeTag: '10:15', title: 'Bagno di vapore', description: 'Relax nel tradizionale bagno di vapore.' },
          { timeTag: '10:30', title: 'Scrub hammam', description: 'Peeling con guanto di crine sulla lastra di marmo riscaldata.' },
          { timeTag: '11:00', title: 'Massaggio con schiuma', description: 'Massaggio tradizionale con schiuma saponata sul marmo.' },
          { timeTag: '11:30', title: 'Massaggio con oli', description: 'Massaggio rilassante aromatico di 30 minuti.' },
          { timeTag: '12:00', title: 'Rinfrescante e tisana', description: 'Acqua fresca e tisana nella zona relax.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '10:00', title: 'Accueil', description: 'Arrivée au spa et enfilade du peignoir.' },
          { timeTag: '10:15', title: 'Bain de vapeur', description: 'Détente dans le bain de vapeur traditionnel.' },
          { timeTag: '10:30', title: 'Gommage hammam', description: 'Exfoliation kese sur dalle de marbre chauffée.' },
          { timeTag: '11:00', title: 'Massage à la mousse', description: 'Massage traditionnel à la mousse savonneuse.' },
          { timeTag: '11:30', title: 'Massage à l\'huile', description: 'Massage aromatique relaxant de 30 minutes.' },
          { timeTag: '12:00', title: 'Fraîcheur et infusion', description: 'Eau fraîche et tisane en espace détente.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '10:00', title: 'Powitanie', description: 'Przyjazd do spa i przebranie się w szlafrok.' },
          { timeTag: '10:15', title: 'Łaźnia parowa', description: 'Relaks w tradycyjnej łaźni parowej.' },
          { timeTag: '10:30', title: 'Peeling hammam', description: 'Peeling rękawicą z koziej sierści na nagrzanym marmurze.' },
          { timeTag: '11:00', title: 'Masaż z pianą', description: 'Tradycyjny masaż z pianą mydlaną na marmurze.' },
          { timeTag: '11:30', title: 'Masaż olejkowy', description: '30-minutowy relaksujący masaż aromatyczny.' },
          { timeTag: '12:00', title: 'Chłodzenie i herbata', description: 'Zimna woda i herbatka ziołowa w strefie relaksu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '10:00', title: 'Recepción', description: 'Llegada al spa y cambio de ropa.' },
          { timeTag: '10:15', title: 'Baño de vapor', description: 'Relajación en el baño de vapor tradicional.' },
          { timeTag: '10:30', title: 'Exfoliación hammam', description: 'Peeling con guante de crin en la losa de mármol caliente.' },
          { timeTag: '11:00', title: 'Masaje de espuma', description: 'Masaje tradicional con espuma de jabón sobre mármol.' },
          { timeTag: '11:30', title: 'Masaje con aceite', description: 'Masaje aromático relajante de 30 minutos.' },
          { timeTag: '12:00', title: 'Enfriamiento e infusión', description: 'Agua fría e infusión de hierbas en área de relax.' }
        ]
      }
    }
  },
  {
    slug: 'super-safari-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '02:30 PM', title: 'Hotel Pickup', description: 'Transfer to the Super Safari base in the Eastern Desert.' },
          { timeTag: '03:00 PM', title: 'Quad Biking', description: '30-minute thrilling quad bike adventure through desert terrain.' },
          { timeTag: '03:30 PM', title: 'Buggy Ride', description: '30-minute exhilarating buggy ride across desert dunes.' },
          { timeTag: '04:00 PM', title: 'Camel Ride', description: 'Traditional camel trek at golden hour.' },
          { timeTag: '04:30 PM', title: 'Sandboarding', description: 'Fun sandboarding on sand dunes with equipment provided.' },
          { timeTag: '05:00 PM', title: 'Bedouin Village', description: 'Welcome with mint tea, shisha, and henna tattooing.' },
          { timeTag: '06:30 PM', title: 'Bedouin Dinner & Show', description: 'Traditional meal with live music under the stars.' },
          { timeTag: '08:30 PM', title: 'Return Transfer', description: 'Hotel drop-off.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '14:30 Uhr', title: 'Abholung', description: 'Transfer zur Safaristation in der Wüste.' },
          { timeTag: '15:00 Uhr', title: 'Quad-Tour', description: '30-minütige Quad-Fahrt durch die Wüste.' },
          { timeTag: '15:30 Uhr', title: 'Buggy-Fahrt', description: '30 Minuten Buggy-Abenteuer auf Sanddünen.' },
          { timeTag: '16:00 Uhr', title: 'Kamelritt', description: 'Traditioneller Kamelritt in der goldenen Stunde.' },
          { timeTag: '16:30 Uhr', title: 'Sandboarden', description: 'Spaß auf Sanddünen mit Equipment.' },
          { timeTag: '17:00 Uhr', title: 'Beduinenlager', description: 'Tee, Shisha und Henna-Bemalung.' },
          { timeTag: '18:30 Uhr', title: 'Abendessen & Show', description: 'Traditionelles Mahl mit Livemusik.' },
          { timeTag: '20:30 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '14:30', title: 'Трансфер', description: 'Поездка к базе Супер Сафари в восточной пустыне.' },
          { timeTag: '15:00', title: 'Квадроцикл', description: '30 минут езды на квадроцикле по пустыне.' },
          { timeTag: '15:30', title: 'Багги', description: '30 минут захватывающей езды на багги по дюнам.' },
          { timeTag: '16:00', title: 'Верблюд', description: 'Традиционная верблюжья прогулка в золотой час.' },
          { timeTag: '16:30', title: 'Сёрфинг по песку', description: 'Катание на досках по дюнам.' },
          { timeTag: '17:00', title: 'Бедуинская деревня', description: 'Чай с мятой, кальян и хна.' },
          { timeTag: '18:30', title: 'Ужин и шоу', description: 'Традиционный ужин с живой музыкой под звёздами.' },
          { timeTag: '20:30', title: 'Возвращение', description: 'Трансфер обратно в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '14:30', title: 'Prelievo', description: 'Transfer alla base del Super Safari nel deserto.' },
          { timeTag: '15:00', title: 'Quad', description: '30 minuti di quad nel deserto.' },
          { timeTag: '15:30', title: 'Buggy', description: '30 minuti di buggy tra le dune.' },
          { timeTag: '16:00', title: 'Cammello', description: 'Passeggiata in cammello al tramonto.' },
          { timeTag: '16:30', title: 'Sandboard', description: 'Divertimento sulle dune con attrezzatura inclusa.' },
          { timeTag: '17:00', title: 'Villaggio beduino', description: 'Tè alla menta, narghilè e henné.' },
          { timeTag: '18:30', title: 'Cena e spettacolo', description: 'Pasto tradizionale con musica dal vivo sotto le stelle.' },
          { timeTag: '20:30', title: 'Rientro', description: 'Transfer di ritorno in hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '14:30', title: 'Prise en charge', description: 'Transfer vers la base du Super Safari dans le désert.' },
          { timeTag: '15:00', title: 'Quad', description: '30 minutes de quad dans le désert.' },
          { timeTag: '15:30', title: 'Buggy', description: '30 minutes de buggy dans les dunes.' },
          { timeTag: '16:00', title: 'Chameau', description: 'Balade à dos de chameau à l\'heure dorée.' },
          { timeTag: '16:30', title: 'Sandboard', description: 'Glisse sur les dunes avec équipement fourni.' },
          { timeTag: '17:00', title: 'Village bédouin', description: 'Thé à la menthe, chicha et henné.' },
          { timeTag: '18:30', title: 'Dîner et spectacle', description: 'Repas traditionnel avec musique live sous les étoiles.' },
          { timeTag: '20:30', title: 'Retour à l\'hôtel', description: 'Transfer retour.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '14:30', title: 'Odbiór', description: 'Transfer do bazy Super Safari na pustyni.' },
          { timeTag: '15:00', title: 'Quad', description: '30 minut jazdy quadem po pustyni.' },
          { timeTag: '15:30', title: 'Buggy', description: '30 minut ekscytującej jazdy buggy przez wydmy.' },
          { timeTag: '16:00', title: 'Wielbłąd', description: 'Tradycyjna przejażdżka wielbłądem o złotej godzinie.' },
          { timeTag: '16:30', title: 'Sandboarding', description: 'Zjazdy na desce po wydmach ze sprzętem w zestawie.' },
          { timeTag: '17:00', title: 'Wioska beduińska', description: 'Herbata miętowa, shisha i henna.' },
          { timeTag: '18:30', title: 'Kolacja i pokaz', description: 'Tradycyjna kolacja z muzyką na żywo pod gwiazdami.' },
          { timeTag: '20:30', title: 'Powrót', description: 'Transfer powrotny do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '14:30', title: 'Recogida', description: 'Traslado a la base del Super Safari en el desierto.' },
          { timeTag: '15:00', title: 'Quad', description: '30 minutos de emocionante quad por el desierto.' },
          { timeTag: '15:30', title: 'Buggy', description: '30 minutos de buggy por las dunas.' },
          { timeTag: '16:00', title: 'Camello', description: 'Paseo en camello a la hora dorada.' },
          { timeTag: '16:30', title: 'Sandboarding', description: 'Deslizamiento en dunas con equipo incluido.' },
          { timeTag: '17:00', title: 'Aldea beduina', description: 'Té de menta, shisha y henna.' },
          { timeTag: '18:30', title: 'Cena y espectáculo', description: 'Cena tradicional con música en vivo bajo las estrellas.' },
          { timeTag: '20:30', title: 'Regreso', description: 'Transfer de vuelta al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'dolphin-photo-session-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '09:00 AM', title: 'Hotel Pickup', description: 'Transfer to the dolphin facility.' },
          { timeTag: '09:45 AM', title: 'Safety Briefing', description: 'Introduction and safety rules for the dolphin photo session.' },
          { timeTag: '10:00 AM', title: 'Dolphin Photo Session', description: 'Stand alongside and pose for professional photos with the trained dolphins.' },
          { timeTag: '10:30 AM', title: 'Photo Collection', description: 'View and collect your professional digital photos.' },
          { timeTag: '11:00 AM', title: 'Return Transfer', description: 'Drop-off back at your hotel.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '09:00 Uhr', title: 'Hotelabholung', description: 'Transfer zur Delphin-Einrichtung.' },
          { timeTag: '09:45 Uhr', title: 'Sicherheitseinweisung', description: 'Einführung und Regeln für die Foto-Session.' },
          { timeTag: '10:00 Uhr', title: 'Delfin-Fotoshooting', description: 'Posen neben dressierten Delfinen für Profifotos.' },
          { timeTag: '10:30 Uhr', title: 'Fotos abholen', description: 'Digitale Fotos ansehen und mitnehmen.' },
          { timeTag: '11:00 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '09:00', title: 'Трансфер', description: 'Поездка к дельфинарию.' },
          { timeTag: '09:45', title: 'Инструктаж', description: 'Ознакомление с правилами фотосессии с дельфинами.' },
          { timeTag: '10:00', title: 'Фотосессия с дельфинами', description: 'Фото рядом с дрессированными дельфинами.' },
          { timeTag: '10:30', title: 'Получение фотографий', description: 'Просмотр и получение цифровых снимков.' },
          { timeTag: '11:00', title: 'Возвращение', description: 'Трансфер обратно в отель.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '09:00', title: 'Prelievo in hotel', description: 'Transfer alla struttura con i delfini.' },
          { timeTag: '09:45', title: 'Briefing', description: 'Introduzione e regole per la sessione fotografica.' },
          { timeTag: '10:00', title: 'Sessione foto con i delfini', description: 'Posare accanto ai delfini per foto professionali.' },
          { timeTag: '10:30', title: 'Ritiro foto', description: 'Visualizzazione e ritiro delle foto digitali.' },
          { timeTag: '11:00', title: 'Rientro in hotel', description: 'Transfer di ritorno.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '09:00', title: 'Prise en charge', description: 'Transfer vers la structure dauphins.' },
          { timeTag: '09:45', title: 'Briefing', description: 'Introduction et règles pour la séance photo.' },
          { timeTag: '10:00', title: 'Session photo dauphins', description: 'Poser à côté des dauphins pour des photos pro.' },
          { timeTag: '10:30', title: 'Récupérer les photos', description: 'Voir et récupérer vos photos numériques.' },
          { timeTag: '11:00', title: 'Retour à l\'hôtel', description: 'Transfer retour.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '09:00', title: 'Odbiór z hotelu', description: 'Transfer do ośrodka z delfinami.' },
          { timeTag: '09:45', title: 'Briefing', description: 'Zasady sesji zdjęciowej z delfinami.' },
          { timeTag: '10:00', title: 'Sesja zdjęciowa z delfinami', description: 'Pozowanie obok delfinów do profesjonalnych zdjęć.' },
          { timeTag: '10:30', title: 'Odbiór zdjęć', description: 'Przeglądanie i odbiór cyfrowych zdjęć.' },
          { timeTag: '11:00', title: 'Powrót do hotelu', description: 'Transfer powrotny.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '09:00', title: 'Recogida en el hotel', description: 'Traslado al recinto de delfines.' },
          { timeTag: '09:45', title: 'Instrucciones', description: 'Reglas y orientación para la sesión de fotos.' },
          { timeTag: '10:00', title: 'Sesión de fotos con delfines', description: 'Posar junto a los delfines para fotos profesionales.' },
          { timeTag: '10:30', title: 'Recoger fotos', description: 'Ver y recoger sus fotos digitales.' },
          { timeTag: '11:00', title: 'Regreso al hotel', description: 'Transfer de vuelta.' }
        ]
      }
    }
  },
  {
    slug: 'desert-safari-3h-dinner-show',
    translations: {
      en: {
        itinerary: [
          { timeTag: '03:00 PM', title: 'Hotel Pickup', description: 'Transfer to the desert safari zone.' },
          { timeTag: '03:30 PM', title: 'Quad Bike & Camel Ride', description: 'Combined quad biking and camel ride through the desert.' },
          { timeTag: '04:30 PM', title: 'Bedouin Village Arrival', description: 'Arrive at the Bedouin camp, enjoy mint tea and shisha.' },
          { timeTag: '05:00 PM', title: 'Sunset Viewing', description: 'Watch the breathtaking sunset over the desert from an elevated dune.' },
          { timeTag: '05:30 PM', title: 'Traditional Bedouin Dinner', description: 'Full traditional dinner including grilled meats, rice, salads, and fresh bread.' },
          { timeTag: '07:00 PM', title: 'Live Bedouin Music Show', description: 'Enjoy traditional Bedouin drumming, poetry, and dance around the fire.' },
          { timeTag: '08:30 PM', title: 'Return Transfer', description: 'Hotel drop-off in Hurghada.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '15:00 Uhr', title: 'Abholung', description: 'Transfer zur Wüstensafarizone.' },
          { timeTag: '15:30 Uhr', title: 'Quad & Kamel', description: 'Kombinierte Quad-Fahrt und Kamelritt durch die Wüste.' },
          { timeTag: '16:30 Uhr', title: 'Beduinenlager', description: 'Ankommen am Lager mit Minztee und Shisha.' },
          { timeTag: '17:00 Uhr', title: 'Sonnenuntergang', description: 'Atemberaubender Sonnenuntergang über der Wüste.' },
          { timeTag: '17:30 Uhr', title: 'Beduinen-Abendessen', description: 'Vollständiges traditionelles Dinner mit Grillfleisch und Beilagen.' },
          { timeTag: '19:00 Uhr', title: 'Liveshow', description: 'Beduinentrommeln, Dichtung und Tanz am Lagerfeuer.' },
          { timeTag: '20:30 Uhr', title: 'Rücktransfer', description: 'Rückfahrt zum Hotel.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '15:00', title: 'Трансфер', description: 'Поездка к зоне пустынного сафари.' },
          { timeTag: '15:30', title: 'Квадроцикл и верблюд', description: 'Совмещённая поездка на квадроцикле и верблюде.' },
          { timeTag: '16:30', title: 'Бедуинский лагерь', description: 'Прибытие в лагерь: чай с мятой и кальян.' },
          { timeTag: '17:00', title: 'Закат', description: 'Потрясающий закат над пустыней с дюны.' },
          { timeTag: '17:30', title: 'Бедуинский ужин', description: 'Полноценный ужин: мясо на гриле, рис, салаты и свежий хлеб.' },
          { timeTag: '19:00', title: 'Шоу живой музыки', description: 'Бедуинские барабаны, поэзия и танцы у огня.' },
          { timeTag: '20:30', title: 'Возвращение', description: 'Трансфер в отель в Хургаде.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '15:00', title: 'Prelievo', description: 'Transfer alla zona safari del deserto.' },
          { timeTag: '15:30', title: 'Quad e cammello', description: 'Combinazione di quad e giro in cammello nel deserto.' },
          { timeTag: '16:30', title: 'Villaggio beduino', description: 'Arrivo al campo: tè alla menta e narghilè.' },
          { timeTag: '17:00', title: 'Tramonto', description: 'Tramonto mozzafiato sul deserto da una duna.' },
          { timeTag: '17:30', title: 'Cena beduina', description: 'Cena tradizionale completa con carne alla griglia e contorni.' },
          { timeTag: '19:00', title: 'Spettacolo dal vivo', description: 'Percussioni, poesia e danza beduina intorno al fuoco.' },
          { timeTag: '20:30', title: 'Rientro', description: 'Transfer di ritorno in hotel.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '15:00', title: 'Prise en charge', description: 'Transfer vers la zone safari dans le désert.' },
          { timeTag: '15:30', title: 'Quad et chameau', description: 'Combinaison quad et chameau dans le désert.' },
          { timeTag: '16:30', title: 'Camp bédouin', description: 'Arrivée au camp : thé à la menthe et chicha.' },
          { timeTag: '17:00', title: 'Coucher de soleil', description: 'Coucher de soleil spectaculaire sur les dunes.' },
          { timeTag: '17:30', title: 'Dîner bédouin', description: 'Repas traditionnel complet avec viandes grillées et accompagnements.' },
          { timeTag: '19:00', title: 'Spectacle live', description: 'Percussions, poésie et danse bédouine autour du feu.' },
          { timeTag: '20:30', title: 'Retour à l\'hôtel', description: 'Transfer retour.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '15:00', title: 'Odbiór', description: 'Transfer do strefy safari na pustyni.' },
          { timeTag: '15:30', title: 'Quad i wielbłąd', description: 'Połączona przejażdżka quadem i wielbłądem.' },
          { timeTag: '16:30', title: 'Obóz beduiński', description: 'Przybycie do obozu: herbata miętowa i shisha.' },
          { timeTag: '17:00', title: 'Zachód słońca', description: 'Spektakularny zachód słońca nad pustynią z wydmy.' },
          { timeTag: '17:30', title: 'Kolacja beduińska', description: 'Pełna tradycyjna kolacja z mięsem z grilla i dodatkami.' },
          { timeTag: '19:00', title: 'Pokaz na żywo', description: 'Beduińskie bębny, poezja i tańce przy ogniu.' },
          { timeTag: '20:30', title: 'Powrót', description: 'Transfer powrotny do hotelu.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '15:00', title: 'Recogida', description: 'Traslado a la zona de safari en el desierto.' },
          { timeTag: '15:30', title: 'Quad y camello', description: 'Combinación de quad y paseo en camello.' },
          { timeTag: '16:30', title: 'Campamento beduino', description: 'Llegada al campamento: té de menta y shisha.' },
          { timeTag: '17:00', title: 'Puesta de sol', description: 'Impresionante puesta de sol sobre el desierto desde una duna.' },
          { timeTag: '17:30', title: 'Cena beduina', description: 'Cena tradicional completa con carnes a la parrilla y guarniciones.' },
          { timeTag: '19:00', title: 'Espectáculo en vivo', description: 'Percusión, poesía y danza beduina alrededor del fuego.' },
          { timeTag: '20:30', title: 'Regreso', description: 'Transfer de vuelta al hotel.' }
        ]
      }
    }
  },
  {
    slug: 'spa-moroccan-bath-massage-hurghada',
    translations: {
      en: {
        itinerary: [
          { timeTag: '10:00 AM', title: 'Welcome', description: 'Arrival at the spa and welcome consultation.' },
          { timeTag: '10:15 AM', title: 'Steam Room', description: 'Open pores in the steam room.' },
          { timeTag: '10:30 AM', title: 'Black Soap Application', description: 'Traditional Moroccan black soap (beldi) applied and left to absorb.' },
          { timeTag: '10:45 AM', title: 'Kessa Exfoliation Scrub', description: 'Full-body exfoliation with Moroccan kessa glove to remove dead skin.' },
          { timeTag: '11:15 AM', title: 'Rhassoul Clay Mask', description: 'Mineral-rich rhassoul clay mask applied to body and face.' },
          { timeTag: '11:45 AM', title: 'Argan Oil Massage', description: '30-minute nourishing massage with pure Moroccan argan oil.' },
          { timeTag: '12:15 PM', title: 'Moroccan Mint Tea', description: 'Wind-down with authentic Moroccan mint tea and dates.' }
        ]
      },
      de: {
        itinerary: [
          { timeTag: '10:00 Uhr', title: 'Empfang', description: 'Ankunft und Beratungsgespräch.' },
          { timeTag: '10:15 Uhr', title: 'Dampfbad', description: 'Vorbereitung im Dampfbad.' },
          { timeTag: '10:30 Uhr', title: 'Schwarze Seife', description: 'Traditionelle marokkanische Beldi-Seife auftragen.' },
          { timeTag: '10:45 Uhr', title: 'Kessa-Peeling', description: 'Ganzkörper-Peeling mit marokkanischem Kessa-Handschuh.' },
          { timeTag: '11:15 Uhr', title: 'Rhassoul-Tonmaske', description: 'Mineralreiche Tonmaske für Körper und Gesicht.' },
          { timeTag: '11:45 Uhr', title: 'Arganöl-Massage', description: '30-minütige nährende Massage mit reinem Arganöl.' },
          { timeTag: '12:15 Uhr', title: 'Marokkanischer Minztee', description: 'Abschluss mit echtem marokkanischen Tee und Datteln.' }
        ]
      },
      ru: {
        itinerary: [
          { timeTag: '10:00', title: 'Приём', description: 'Прибытие в спа и консультация.' },
          { timeTag: '10:15', title: 'Паровая баня', description: 'Раскрытие пор в паровой комнате.' },
          { timeTag: '10:30', title: 'Чёрное мыло', description: 'Нанесение традиционного марокканского мыла бельди.' },
          { timeTag: '10:45', title: 'Пилинг кесса', description: 'Полный пилинг тела марокканской рукавицей.' },
          { timeTag: '11:15', title: 'Маска из глины рассул', description: 'Минеральная глиняная маска для тела и лица.' },
          { timeTag: '11:45', title: 'Массаж аргановым маслом', description: '30 минут питательного массажа с чистым аргановым маслом.' },
          { timeTag: '12:15', title: 'Марокканский чай с мятой', description: 'Завершение с настоящим марокканским мятным чаем и финиками.' }
        ]
      },
      it: {
        itinerary: [
          { timeTag: '10:00', title: 'Accoglienza', description: 'Arrivo alla spa e consulenza.' },
          { timeTag: '10:15', title: 'Bagno di vapore', description: 'Apertura dei pori nel bagno di vapore.' },
          { timeTag: '10:30', title: 'Sapone nero', description: 'Applicazione del tradizionale sapone marocchino beldi.' },
          { timeTag: '10:45', title: 'Peeling kessa', description: 'Esfoliazione corpo con guanto kessa marocchino.' },
          { timeTag: '11:15', title: 'Maschera di argilla rhassoul', description: 'Maschera ricca di minerali per corpo e viso.' },
          { timeTag: '11:45', title: 'Massaggio all\'olio di argan', description: '30 minuti di massaggio nutriente con olio di argan puro.' },
          { timeTag: '12:15', title: 'Tè alla menta marocchino', description: 'Finale con autentico tè marocchino e datteri.' }
        ]
      },
      fr: {
        itinerary: [
          { timeTag: '10:00', title: 'Accueil', description: 'Arrivée au spa et consultation.' },
          { timeTag: '10:15', title: 'Bain de vapeur', description: 'Ouverture des pores dans le bain de vapeur.' },
          { timeTag: '10:30', title: 'Savon noir beldi', description: 'Application du savon noir marocain traditionnel.' },
          { timeTag: '10:45', title: 'Gommage kessa', description: 'Exfoliation corps avec gant kessa marocain.' },
          { timeTag: '11:15', title: 'Masque rhassoul', description: 'Masque argile rhassoul minéral pour corps et visage.' },
          { timeTag: '11:45', title: 'Massage huile d\'argan', description: '30 minutes de massage nourrissant à l\'huile d\'argan pure.' },
          { timeTag: '12:15', title: 'Thé marocain', description: 'Fin de soin avec authentique thé à la menthe marocain et dattes.' }
        ]
      },
      pl: {
        itinerary: [
          { timeTag: '10:00', title: 'Powitanie', description: 'Przyjazd do spa i konsultacja.' },
          { timeTag: '10:15', title: 'Łaźnia parowa', description: 'Otwieranie porów w łaźni parowej.' },
          { timeTag: '10:30', title: 'Czarne mydło', description: 'Nałożenie tradycyjnego marokańskiego mydła beldi.' },
          { timeTag: '10:45', title: 'Peeling kessa', description: 'Peeling całego ciała rękawicą kessa.' },
          { timeTag: '11:15', title: 'Maska z gliny rhassoul', description: 'Bogata w minerały maska glinkowa na ciało i twarz.' },
          { timeTag: '11:45', title: 'Masaż olejkiem arganowym', description: '30-minutowy odżywczy masaż czystym olejkiem arganowym.' },
          { timeTag: '12:15', title: 'Marokańska herbata miętowa', description: 'Zakończenie z autentyczną herbatą miętową i daktylami.' }
        ]
      },
      es: {
        itinerary: [
          { timeTag: '10:00', title: 'Recepción', description: 'Llegada al spa y consulta.' },
          { timeTag: '10:15', title: 'Baño de vapor', description: 'Apertura de poros en el baño de vapor.' },
          { timeTag: '10:30', title: 'Jabón negro beldi', description: 'Aplicación del tradicional jabón negro marroquí.' },
          { timeTag: '10:45', title: 'Exfoliación kessa', description: 'Exfoliación corporal con guante kessa marroquí.' },
          { timeTag: '11:15', title: 'Mascarilla de arcilla rhassoul', description: 'Mascarilla mineral de arcilla para cuerpo y rostro.' },
          { timeTag: '11:45', title: 'Masaje con aceite de argán', description: '30 minutos de masaje nutritivo con aceite de argán puro.' },
          { timeTag: '12:15', title: 'Té de menta marroquí', description: 'Final con auténtico té de menta marroquí y dátiles.' }
        ]
      }
    }
  }
];

async function mergeItinerary(tour, slug) {
  const current = await prisma.tour.findUnique({
    where: { slug },
    select: { translations: true }
  });

  if (!current) {
    console.log(`  ⚠ SKIP (not found): ${slug}`);
    return;
  }

  const existingTrans = (current.translations && typeof current.translations === 'object') ? current.translations : {};
  const updatedTrans = { ...existingTrans };

  for (const [lang, data] of Object.entries(tour.translations)) {
    if (!updatedTrans[lang]) {
      updatedTrans[lang] = {};
    }
    if (data.itinerary && Array.isArray(data.itinerary) && data.itinerary.length > 0) {
      updatedTrans[lang].itinerary = data.itinerary;
    }
  }

  await prisma.tour.update({
    where: { slug },
    data: { translations: updatedTrans }
  });

  console.log(`  ✓ Updated itinerary: ${slug}`);
}

async function main() {
  console.log('══════════════════════════════════════');
  console.log('  Backfilling 23 Legacy Tour Itineraries');
  console.log('══════════════════════════════════════');

  let ok = 0;
  let fail = 0;

  for (const tour of legacyBackfill) {
    try {
      await mergeItinerary(tour, tour.slug);
      ok++;
    } catch (err) {
      console.error(`  ✗ Error on ${tour.slug}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n✅ Done: ${ok} updated, ${fail} failed`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
