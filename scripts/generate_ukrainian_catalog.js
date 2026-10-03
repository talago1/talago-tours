const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// High-quality destination translations in Ukrainian
const DESTINATION_TRANSLATIONS_UK = {
  alexandria: {
    name: 'Александрія',
    description: 'Перлина Середземномор’я з її величною бібліотекою, цитаделлю Кайтбей та римськими катакомбами.',
  },
  'sharm-el-sheikh': {
    name: 'Шарм-ель-Шейх',
    description: 'Курортна перлина Синайського півострова з кораловими рифами Рас-Мохаммед та розкішними бухтами.',
  },
  'marsa-alam': {
    name: 'Марса-Алам',
    description: 'Незайманий рай Червоного моря: дикі дюгоні, гігантські черепахи Абу-Даббаб та фантастичні коралові сади.',
  },
  'siwa-oasis': {
    name: 'Оазис Сива',
    description: 'Містичний оазис у Західній пустелі з кришталевими соляними озерами, гарячими джерелами та храмом Оракула.',
  },
  siwa: {
    name: 'Оазис Сива',
    description: 'Містичний оазис у Західній пустелі з кришталевими соляними озерами, гарячими джерелами та храмом Оракула.',
  },
  luxor: {
    name: 'Луксор',
    description: 'Найбільший у світі музей просто неба: Долина царів, Карнакський і Луксорський храми над величним Нілом.',
  },
  safaga: {
    name: 'Сафага',
    description: 'Спокійний морський курорт, відомий лікувальними чорними пісками, чистим повітрям та чудовим віндсерфінгом.',
  },
  fayoum: {
    name: 'Ель-Фаюм',
    description: 'Оазис стародавніх озер, водоспадів Ваді-ель-Раян та доісторичної Долини китів (Ваді-аль-Хітан).',
  },
  'sahl-hasheesh': {
    name: 'Сахл-Хашиш',
    description: 'Ексклюзивний закритий курорт із кілометровими піщаними пляжами, променадом та розкішними готелями.',
  },
  'soma-bay': {
    name: 'Сома-Бей',
    description: 'Преміальний півострів з ідеальними умовами для кайтсерфінгу, гольфу світового рівня та таласотерапії.',
  },
  aswan: {
    name: 'Асуан',
    description: 'Спокійний нубійський шарм, величні гранітні скелі Нілу, острів Філе та легендарні храми Абу-Сімбел.',
  },
  'el-alamein': {
    name: 'Ель-Аламейн',
    description: 'Білосніжні середземноморські пляжі, бірюзові лагуни та меморіали світової історії.',
  },
  hurghada: {
    name: 'Хургада',
    description: 'Головне курортне серце Червоного моря з розкішними островами, сафарі пустелею та яскравими враженнями.',
  },
  cairo: {
    name: 'Каїр та Піраміди',
    description: 'Величні піраміди Гізи, Сфінкс, Великий Єгипетський музей та колоритні східні базари тисячолітньої столиці.',
  },
  'el-gouna': {
    name: 'Ель-Гуна',
    description: '«Єгипетська Венеція» з мережею бірюзових лагун, вишуканими маринами та стильними ресторанами.',
  },
  'makadi-bay': {
    name: 'Макаді-Бей',
    description: 'Затишна затока з барвистими домашніми рифами, кришталевою водою та першокласними сімейними курортами.',
  },
};

// High-quality blog translations in Ukrainian (and all missing langs for p5 & p6)
const BLOG_TRANSLATIONS = {
  'orange-bay-giftun-island-guide': {
    uk: {
      title: 'Оранж Бей та острів Гіфтун: як обрати ідеальний острівний відпочинок на Червоному морі',
      content:
        'Оранж Бей розташований на південному краю острова Гіфтун, приблизно за 45 хвилин на катері від марини Хургади. Вода тут настільки прозора, що піщана коса змінює колір від ніжно-золотого до яскраво-бірюзового за лічені метри, завдяки чому це місце стало візитною карткою Червоного моря.\n\nПроте не всі острівні поїздки однакові. Різниця між поспішною екскурсією та по-справжньому розкішним днем полягає в часі виїзду, розмірі судна та продуманості маршруту.\n\nВирушайте раніше. Вихід із марини між 08:00 та 08:30 дозволяє дістатися Оранж Бей до прибуття великих екскурсійних флотів. Перша година на піщаній косі — найспокійніша, а світло ідеальне для фотографій.\n\nОбирайте комфортне судно. Менша яхта з сонячною палубою та затіненим лаунжем дає свободу руху, якісний обід і морських гідів, які супроводжують кожну групу.\n\nПриділіть увагу кораловому рифу. Снорклінг біля Гіфтуна найкращий вранці, коли море спокійне, а видимість перевищує 20 метрів. Тут можна зустріти риб-папуг, рибу-наполеона та, якщо пощастить, зелену морську черепаху.\n\nTALAGO забезпечує трансфер з готелю, якісне спорядження, свіжоприготований шведський стіл та безлімітні напої з турботливим гідом для кожної групи.',
      excerpt:
        'Бірюзове мілководдя, м’який білий пісок та коралові сади неподалік Хургади. Як спланувати відпочинок на острові з максимальним комфортом.',
    },
  },
  'ras-mohamed-reef-snorkeling-guide': {
    uk: {
      title: 'Рас-Мохаммед: гід зі снорклінгу в найстарішому морському заповіднику Єгипту',
      content:
        'Національний парк Рас-Мохаммед — це еталон підводного світу Червоного моря. Розташований на стику Суецької та Акабської заток, цей морський заповідник має неймовірну різноманітність коралів та риб.\n\nТут ви побачите вертикальні коралові стіни, мангрові гаї та Магічне озеро. Найкращі місця для снорклінгу — рифи Аолака та Іоланда, де часто можна побачити морських черепах, зграї баракуд та скатів.\n\nTALAGO пропонує як морські VIP-круїзи на білосніжних яхтах із висадкою на Білий острів, так і комфортні наземні експедиції з кваліфікованими гідами-натуралістами.',
      excerpt:
        'Світовий центр підводної краси: коралові стіни, кришталева вода та мангрові гаї заповідника Рас-Мохаммед.',
    },
  },
  'luxor-day-trip-from-hurghada': {
    uk: {
      title: 'Луксор за один день з Хургади: храми, гробниці та секрети таймінгу',
      content:
        'Подорож із узбережжя Червоного моря в серце стародавніх Фів — це одне з найбільш вражаючих вражень у житті. Менш ніж за 4 години дороги на комфортному транспорті перед вами постає величний Ніл.\n\nПрограма TALAGO включає відвідування Карнакського храму з його легендарним гіпостильним залом, переправу через Ніл на традиційному човні, обід у місцевому ресторані та подорож до Долини Царів і терасового храму цариці Хатшепсут.\n\nМи обмежуємо розмір груп до мінімуму, щоб забезпечити особистий супровід професійного гіда-єгиптолога та комфорт на кожному кроці.',
      excerpt:
        'Долина царів, велич Карнака та таємниці фараонів: як відвідати Луксор з комфортом без втоми.',
    },
  },
  'desert-safari-quad-atv-hurghada': {
    uk: {
      title: 'Сафарі в пустелі з Хургади: квадроцикли, дюни та автентичний бедуїнський вечір',
      content:
        'Східна пустеля за Хургадою відкриває захоплюючі пейзажі золотих каньйонів і високих гір. Поїздка на квадроциклах на світанку або заході сонця дарує неймовірне відчуття швидкості та свободи.\n\nПісля активного драйву ви прибуваєте до традиційного бедуїнського табору, де на вас чекає катання на верблюдах, ароматний м’ятний чай біля вогнища, свіжий хліб прямо з печі та традиційний барбекю під мільйонами зірок.\n\nTALAGO використовує нову техніку, надає якісні шоломи та організовує трансфери на кондиціонованих авто преміум-класу.',
      excerpt:
        'Драйв на потужних квадроциклах піщаними просторами, зустріч заходу сонця в горах та бедуїнська гостинність.',
    },
  },
  'ultimate-guide-giftun-island-orange-bay-hurghada': {
    en: {
      title: 'The Ultimate Guide to Giftun Island & Orange Bay in Hurghada (2026)',
      content:
        'Orange Bay on Giftun Island is often referred to as the Egyptian Maldives. Crystal-clear turquoise lagoons, shallow sandbanks, and wooden swings make it an unforgettable experience.\n\nTips for the best trip:\n1. Choose an early morning departure to avoid crowds.\n2. Ensure your yacht provides snorkel gear and experienced dive guides.\n3. Take reef-safe sunscreen and plenty of camera memory for iconic beach shots.\n\nBook your trip with TALAGO for seamless hotel transfers, VIP lunch, and dedicated marine guidance.',
      excerpt:
        'Everything you need to know about visiting Orange Bay and Giftun Island in 2026: best times, what to pack, and how to get the true luxury experience.',
    },
    de: {
      title: 'Der ultimative Reiseführer für Giftun Island & Orange Bay in Hurghada (2026)',
      content:
        'Orange Bay auf der Insel Giftun wird oft als die ägyptischen Malediven bezeichnet. Kristallklares türkisfarbenes Wasser, flache Sandbänke und Holzschaukeln im Meer machen diesen Ausflug unvergesslich.\n\nTipps für die perfekte Tour:\n1. Wählen Sie eine frühe Abfahrt, um den Massen zu entgehen.\n2. Achten Sie auf hochwertige Schnorchelausrüstung und erfahrene Guides an Bord.\n3. Nehmen Sie rifffreundliche Sonnencreme mit für entspannte Stunden im Paradies.\n\nBuchen Sie mit TALAGO für bequemen Hoteltransfer, erstklassiges Buffet und persönlichen Service.',
      excerpt:
        'Alles, was Sie für Ihren Besuch in der Orange Bay und auf Giftun Island 2026 wissen müssen: beste Reisezeiten, Ausrüstung und VIP-Tipps.',
    },
    ru: {
      title: 'Полный путеводитель по острову Оранж Бей в Хургаде (2026)',
      content:
        'Оранж Бей на острове Гифтун называют египетскими Мальдивами. Кристально бирюзовые лагуны, песчаная коса и деревянные качели прямо в воде дарят незабываемые эмоции.\n\nСоветы для идеального отдыха:\n1. Выбирайте ранний выезд, чтобы насладиться спокойным морем до приезда больших групп.\n2. Убедитесь, что яхта предоставляет качественные маски и ласты.\n3. Защитите кожу солнцезащитным кремом и приготовьте камеру для лучших кадров.\n\nTALAGO организует поездки на комфортабельных яхтах с изысканным обедом и заботливым сервисом.',
      excerpt:
        'Все, что нужно знать о посещении Оранж Бей и острова Гифтун в 2026 году: лучшее время, что взять с собой и как получить VIP-впечатления.',
    },
    it: {
      title: 'Guida Completa a Giftun Island e Orange Bay a Hurghada (2026)',
      content:
        'Orange Bay sull’isola di Giftun è considerata le Maldive d’Egitto. Lagune turchesi cristalline, bassi fondali sabbiosi e altalene sull’acqua regalano momenti magici.\n\nConsigli per la visita:\n1. Partite presto al mattino per evitare la folla.\n2. Scegliete escursioni con guide snorkeling esperte.\n3. Portate crema solare e macchina fotografica per foto spettacolari.\n\nPrenotate con TALAGO per trasferimenti confortevoli, pranzo a buffet e servizio impeccabile.',
      excerpt:
        'Tutto quello che c’è da sapere per visitare Orange Bay e Giftun Island nel 2026: orari migliori, consigli utili ed esperienze esclusive.',
    },
    fr: {
      title: 'Guide Ultime de l’Île de Giftun et d’Orange Bay à Hurghada (2026)',
      content:
        'Orange Bay sur l’île de Giftun est souvent appelée les Maldives égyptiennes. Des lagons turquoise translucides, des bancs de sable blanc et des balançoires dans l’eau en font un cadre paradisiaque.\n\nNos conseils essentiels:\n1. Partez tôt le matin pour profiter de la quiétude des lieux.\n2. Assurez-vous d’avoir un équipement de snorkeling de qualité.\n3. Prévoyez une protection solaire adaptée aux récifs coralliens.\n\nAvec TALAGO, profitez d’un transfert depuis votre hôtel, d’un buffet raffiné et d’un encadrement aux petits soins.',
      excerpt:
        'Tout savoir pour visiter Orange Bay et Giftun Island en 2026: horaires idéaux, conseils pratiques et croisières VIP.',
    },
    pl: {
      title: 'Kompletny Przewodnik po Wyspie Giftun i Orange Bay w Hurghadzie (2026)',
      content:
        'Orange Bay na wyspie Giftun to egipskie Malediwy. Krystalicznie turkusowa woda, piaszczysta mielizna i drewniane huśtawki w morzu tworzą rajską scenerię.\n\nWskazówki:\n1. Wybierz wczesny rejs, aby uniknąć tłumów.\n2. Upewnij się, że łódź zapewnia profesjonalny sprzęt do snorkelingu.\n3. Zabierz krem z filtrem i aparat fotograficzny na niezapomniane zdjęcia.\n\nZarezerwuj z TALAGO: komfortowy transfer, wyśmienity obiad i polska/wielojęzyczna opieka.',
      excerpt:
        'Wszystko o wycieczce na Orange Bay i wyspę Giftun w 2026 roku: kiedy płynąć, co zabrać i jak cieszyć się luksusowym rejsem.',
    },
    es: {
      title: 'Guía Definitiva de la Isla Giftun y Orange Bay en Hurghada (2026)',
      content:
        'Orange Bay en la isla Giftun es conocida como las Maldivas de Egipto. Aguas cristalinas de color turquesa, arena suave y columpios sobre el mar crean un paisaje inolvidable.\n\nConsejos destacados:\n1. Salga temprano por la mañana para disfrutar de la playa con calma.\n2. Verifique que la embarcación ofrezca equipo de esnórquel de calidad.\n3. Lleve protector solar y cámara para capturar fotos increíbles.\n\nViaje con TALAGO: traslados puntuales, almuerzo buffet gourmet y atención de primer nivel.',
      excerpt:
        'Todo lo que necesita saber para visitar Orange Bay y Giftun Island en 2026: mejores horarios, qué llevar y servicios VIP.',
    },
    uk: {
      title: 'Повний путівник по острову Оранж Бей у Хургаді (2026)',
      content:
        'Оранж Бей на острові Гіфтун часто називають єгипетськими Мальдівами. Кришталево чисті бірюзові лагуни, мілководні піщані коси та дерев’яні гойдалки у воді створюють казкову атмосферу відпочинку.\n\nПоради для ідеальної поїздки:\n1. Обирайте ранній виїзд, щоб насолодитися спокоєм до прибуття великих екскурсійних груп.\n2. Переконайтеся, що на яхті є якісне спорядження для снорклінгу та досвідчені гіди.\n3. Візьміть сонцезахисний крем та камеру для фантастичних знімків на пляжі.\n\nБронюйте подорож із TALAGO: комфортний трансфер з готелю, смачний обід-буфет та бездоганний морський сервіс.',
      excerpt:
        'Усе, що потрібно знати про відвідування Оранж Бей та острова Гіфтун у 2026 році: найкращий час, що взяти з собою та VIP-рекомендації.',
    },
  },
  'desert-safari-hurghada-quad-biking-tips': {
    en: {
      title: 'Top 5 Tips for Desert Quad Safari & Bedouin BBQ in Egypt',
      content:
        'A desert quad safari is one of the most thrilling adventures in Egypt. To make the most of your desert ride, follow these 5 pro tips:\n1. Wear long lightweight pants and closed sports shoes to protect against engine heat and desert sand.\n2. Protect your face with a traditional keffiyeh scarf and protective goggles.\n3. Keep a steady pace and follow your convoy lead guide.\n4. Take a light jacket for the evening Bedouin dinner when desert temperatures drop.\n5. Keep hydrated by drinking water throughout the excursion.\n\nTALAGO provides premium modern quads, professional safety gear, and memorable Bedouin hospitality.',
      excerpt:
        'Essential practical advice for your ATV quad adventure in Hurghada and Sharm El Sheikh: clothing, safety, and dinner tips.',
    },
    de: {
      title: 'Top 5 Tipps für eine Quad-Safari in der Wüste & Beduinen-BBQ in Ägypten',
      content:
        'Eine Wüstensafari mit dem Quad ist eines der aufregendsten Erlebnisse in Ägypten. Beachten Sie diese 5 Expertentipps:\n1. Tragen Sie lange, leichte Hosen und feste Sportschuhe.\n2. Schützen Sie Ihr Gesicht mit einem Keffiyeh-Tuch und einer Staubbrille.\n3. Halten Sie ein gleichmäßiges Tempo in der Kolonne.\n4. Nehmen Sie eine leichte Jacke für den kühleren Wüstenabend mit.\n5. Trinken Sie ausreichend Wasser während des gesamten Ausflugs.\n\nTALAGO garantiert top-gepflegte Quads, umfassende Sicherheit und herzliche Gastfreundschaft.',
      excerpt:
        'Praktische Ratschläge für Ihre Quad-Wüstensafari in Hurghada: Kleidung, Sicherheit und Beduinen-Abend.',
    },
    ru: {
      title: 'Топ-5 советов для сафари на квадроциклах в пустыне Хургады',
      content:
        'Сафари на квадроциклах — одно из самых ярких приключений в Египте. Чтобы поездка прошла идеально, следуйте нашим 5 советам:\n1. Надевайте закрытую обувь и удобные длинные брюки для защиты от песка и тепла мотора.\n2. Защитите лицо платком-арафаткой и специальными очками.\n3. Держите безопасную дистанцию и следуйте за гидом-инструктором.\n4. Возьмите легкую кофту на вечер — в пустыне после заката становится прохладно.\n5. Пейте достаточное количество воды во время остановок.\n\nTALAGO предоставляет надежную технику, качественную экипировку и незабываемый вечер в гостях у бедуинов.',
      excerpt:
        'Полезные советы для катания на квадроциклах в пустыне: одежда, безопасность и бедуинский ужин под звездами.',
    },
    it: {
      title: 'I 5 Migliori Consigli per il Safari in Quad nel Deserto in Egitto',
      content:
        'Il safari in quad nel deserto è una delle avventure più emozionanti in Egitto. Ecco 5 consigli indispensabili:\n1. Indossate scarpe chiuse e pantaloni lunghi leggeri.\n2. Proteggete il viso con la kefiah e occhiali antipolvere.\n3. Seguite sempre la guida apripista e mantenete la distanza di sicurezza.\n4. Portate una giacca leggera per la cena serale nel villaggio beduino.\n5. Bevete molta acqua durante le soste.\n\nTALAGO assicura quad all’avanguardia, caschi di sicurezza e autentica ospitalità beduina.',
      excerpt:
        'Consigli pratici per la tua avventura in quad nel deserto: abbigliamento, sicurezza e cena sotto le stelle.',
    },
    fr: {
      title: 'Top 5 des Conseils pour un Safari en Quad dans le Désert en Égypte',
      content:
        'Un safari en quad dans le désert est une aventure incontournable en Égypte. Voici nos 5 conseils essentiels:\n1. Portez des chaussures fermées et un pantalon léger.\n2. Protégez-vous avec un chèche bédouin et des lunettes de protection.\n3. Respectez les consignes de sécurité du guide de tête.\n4. Prévoyez une veste pour la soirée bédouine quand la nuit tombe.\n5. Hydratez-vous régulièrement.\n\nTALAGO propose des quads récents, un équipement de sécurité irréprochable et un délicieux dîner barbecue.',
      excerpt:
        'Conseils indispensables pour votre excursion en quad dans le désert: tenue recommandée, sécurité et soirée bédouine.',
    },
    pl: {
      title: 'Top 5 Wskazówek na Safari na Quadach i Kolację Beduinów w Egipcie',
      content:
        'Safari na quadach przez pustynię to potężna dawka emocji. Oto 5 praktycznych wskazówek:\n1. Załóż zakryte buty sportowe i długie, przewiewne spodnie.\n2. Zabezpiecz twarz chustą arafatką i goglami ochronnymi.\n3. Utrzymuj bezpieczny odstęp w kolumnie za przewodnikiem.\n4. Weź lekką bluzę na wieczór w wiosce beduińskiej.\n5. Pamiętaj o regularnym piciu wody.\n\nTALAGO zapewnia nowoczesne quady, certyfikowane kaski i niezapomniany wieczór pod gwiazdami.',
      excerpt:
        'Praktyczny poradnik przed wyjazdem na quady do pustyni w Hurghadzie: ubiór, bezpieczeństwo i kolacja u Beduinów.',
    },
    es: {
      title: 'Los 5 Mejores Consejos para un Safari en Quad por el Desierto en Egipto',
      content:
        'Un safari en quad por el deserto es una experiencia fascinante. Para disfrutar al máximo, siga estos 5 consejos:\n1. Use calzado deportivo cerrado y pantalones largos ligeros.\n2. Cúbrase con el pañuelo tradicional keffiyeh y gafas contra el polvo.\n3. Mantenga la distancia de seguridad con el guía.\n4. Lleve una chaqueta ligera para la cena beduina tras la puesta de sol.\n5. Beba suficiente agua durante los descansos.\n\nTALAGO ofrece quads modernos, cascos de protección y una auténtica cena con espectáculo oriental.',
      excerpt:
        'Consejos prácticos para tu safari en quad en el desierto egipcio: qué ropa llevar, seguridad y cena beduina.',
    },
    uk: {
      title: 'Топ-5 порад для сафарі на квадроциклах у пустелі Єгипту та вечері в бедуїнів',
      content:
        'Сафарі на квадроциклах піщаними просторами — одна з найяскравіших пригод під час відпочинку в Єгипті. Дотримуйтесь цих 5 важливих порад:\n1. Одягайте закрите спортивне взуття та зручні довгі штани для захисту від піску та нагрітого двигуна.\n2. Захистіть обличчя традиційною хусткою-арафаткою та спеціальними окулярами від пилу.\n3. Дотримуйтесь безпечної дистанції в колоні за провідним гідом.\n4. Візьміть легку куртку чи кофту на вечір — після заходу сонця в пустелі стає прохолодно.\n5. Пийте достатньо води під час зупинок.\n\nTALAGO гарантує надійну сучасну мототехніку, якісні шоломи та гостинну бедуїнську вечерю біля вогнища.',
      excerpt:
        'Практичні поради для сафарі на квадроциклах у Хургаді: правильний одяг, техніка безпеки та вечір у бедуїнів під зоряним небом.',
    },
  },
};

// Vocabulary dictionary mapping standard Russian phrases to Ukrainian
const PHRASE_MAP = {
  // Inclusions
  'Трансфер из отеля и обратно на автомобиле с кондиционером':
    'Трансфер з готелю та назад на автомобілі з кондиціонером',
  'Круиз на роскошной яхте с солярием и тенистым лаунжем':
    'Круїз на розкішній яхті із солярієм та затіненим лаунжем',
  'Снаряжение для снорклинга (маска, трубка, ласты, жилет)':
    'Спорядження для снорклінгу (маска, трубка, ласти, жилет)',
  'Сертифицированный морской гид по снорклингу':
    'Сертифікований морський гід зі снорклінгу',
  'Обед-буфет на борту + безлимитные напитки, чай и кофе':
    'Обід-буфет на борту + безлімітні напої, чай та кава',
  'Трансфер из отеля и обратно на комфортном автомобиле с кондиционером':
    'Трансфер з готелю та назад на комфортному автомобілі з кондиціонером',
  'Круиз на яхте на весь день с тенистыми лаунжами и солярием':
    'Круїз на яхті на цілий день із затіненими лаунжами та солярієм',
  'Снаряжение для снорклинга и спасательные жилеты':
    'Спорядження для снорклінгу та рятувальні жилети',
  'Сертифицированные морские гиды по дельфинам':
    'Сертифіковані морські гіди з пошуку дельфінів',
  'Полноценный обед-буфет, сезонные фрукты и напитки':
    'Повноцінний обід-буфет, сезонні фрукти та безалкогольні напої',
  'Трансфер из отеля и обратно на джипе 4x4':
    'Трансфер з готелю та назад на джипі 4x4',
  'Поездка на квадроцикле с защитным шлемом':
    'Поїздка на квадроциклі із захисним шоломом',
  'Катание на верблюде': 'Катання на верблюді',
  'Экскурсия по бедуинской деревне и ужин-буфет с напитками':
    'Екскурсія бедуїнським селищем та вечеря-буфет з напоями',
  'Вечернее фольклорное шоу и наблюдение за звёздами':
    'Вечірнє фольклорне шоу та спостереження за зорями',
  'Трансфер из отеля на автомобиле с кондиционером':
    'Трансфер з готелю на автомобілі з кондиціонером',
  'Круиз на весь день с соляриями': 'Круїз на цілий день із солярієм',
  'Снаряжение для снорклинга (маска, трубка, ласты)':
    'Спорядження для снорклінгу (маска, трубка, ласти)',
  'Опытный морской гид': 'Досвідчений морський гід',
  'Вкусный обед-буфет, напитки и вода': 'Смачний обід-буфет, напої та вода',
  'Трансфер из отеля и обратно': 'Трансфер з готелю та назад',
  'Круиз на фараоновском корабле Nefertari': 'Круїз на фараонівському кораблі Nefertari',
  'Обед-буфет с напитками': 'Обід-буфет з напоями',
  'Трансфер из отеля и обратно на комфортабельном автобусе с кондиционером':
    'Трансфер з готелю та назад на комфортабельному автобусі з кондиціонером',
  'Официальный лицензированный гид-египтолог': 'Офіційний ліцензований гід-єгиптолог',
  'Входные билеты в Карнак, Долину царей (3 гробницы) и храм Хатшепсут':
    'Вхідні квитки в Карнак, Долину царів (3 гробниці) та храм Хатшепсут',
  'Переправа через Нил на моторной лодке': 'Переправа через Ніл на моторному човні',
  'Свежий обед в местном ресторане в Луксоре': 'Свіжий обід у місцевому ресторані в Луксорі',
  '2 погружения с гидом — сертифицированным дайвмастером':
    '2 занурення з гідом — сертифікованим дайвмайстром',
  'Баллоны и грузы': 'Балони та вантажі',
  'Обед-буфет и напитки на катере': 'Обід-буфет та напої на катері',
  'Входной билет на пляж Абу-Даббаб с лежаком и зонтом':
    'Вхідний квиток на пляж Абу-Даббаб із шезлонгом та парасолькою',
  'Снаряжение для снорклинга': 'Спорядження для снорклінгу',
  'Помощь гида по снорклингу': 'Допомога гіда зі снорклінгу',
  'Авиабилеты внутренних рейсов туда и обратно': 'Авіаквитки внутрішніх рейсів туди й назад',
  'Частные трансферы в аэропортах Марса-Алам и Каира':
    'Приватні трансфери в аеропортах Марса-Алам та Каїра',
  'Частный лицензированный египтолог в Каире': 'Приватний ліцензований єгиптолог у Каїрі',
  'Входные билеты в зону пирамид Гизы и главные галереи GEM':
    'Вхідні квитки до зони пірамід Гізи та головних галерей GEM',
  'Изысканный обед в выбранном ресторане': 'Вишуканий обід у ресторані',
  'Билет на полу-субмарину': 'Квиток на напівпідводний човен',
  'Место в салоне под водой с кондиционером': 'Місце в підводному салоні з кондиціонером',
  'Напиток или минеральная вода': 'Напій або мінеральна вода',
  'Трансфер из отеля и обратно на 4x4 или авто с кондиционером':
    'Трансфер з готелю та назад на 4x4 або авто з кондиціонером',
  'Входные билеты в национальный парк Вади-эль-Гемаль':
    'Вхідні квитки до національного парку Ваді-ель-Гемаль',
  'Бедуинский обед с напитками и традиционным кофе габана':
    'Бедуїнський обід з напоями та традиційною кавою габана',

  // Exclusions
  'Экологический сбор национального парка (5 $ с человека на борту)':
    'Екологічний збір національного парку (5 $ з особи на борту)',
  'Профессиональный подводный фото/видеоальбом (опционально)':
    'Професійний підводний фото/відеоальбом (за бажанням)',
  'Билет морского заповедника Сатая (5 $)': 'Квиток морського заповідника Сатая (5 $)',
  'Личные сувенирные фото': 'Особисті сувенірні фото',
  'Платок-кеффия и защитные очки (аренда или покупка)':
    'Хустка-арафатка та захисні окуляри (оренда або придбання)',
  'Кальян (опционально)': 'Кальян (за бажанням)',
  'Сбор национального парка Хамата (5 $)': 'Збір національного парку Хамата (5 $)',
  'Личная фотосессия': 'Особиста фотосесія',
  Чаевые: 'Чайові',
  'Профессиональный фотоальбом': 'Професійний фотоальбом',
  'Отдельный билет в гробницу Тутанхамона': 'Окремий квиток до гробниці Тутанхамона',
  'Напитки в ресторане': 'Напої в ресторані',
  'Прокат полного комплекта снаряжения (при необходимости)':
    'Оренда повного комплекту спорядження (за потреби)',
  'Сбор морского парка (10 $)': 'Збір морського парку (10 $)',
  'Обед (опционально или в пляжном ресторане)': 'Обід (за бажанням або в пляжному ресторані)',
  Напитки: 'Напої',
  'Вход внутрь камер Великой пирамиды (опциональный билет на месте)':
    'Вхід усередину камер Великої піраміди (додатковий квиток на місці)',
  'Личный шопинг в Хан-эль-Халили': 'Особистий шопінг у Хан-ель-Халілі',
  'Личные фотоуслуги': 'Особисті фотопослуги',
  'Личные расходы': 'Особисті витрати',

  // What to bring
  'Купальник, пляжные полотенца, очки, солнцезащита, водонепроницаемая камера или чехол для телефона.':
    'Купальник, пляжні рушники, сонцезахисні окуляри, крем від сонця, водонепроникна камера або чохол для смартфона.',
  'Копия паспорта, купальник, полотенца, солнцезащитный крем, солнцезащитные очки.':
    'Копія паспорта, купальник, рушники, сонцезахисний крем, сонцезахисні окуляри.',
  'Удобная спортивная одежда, солнцезащитные очки, платок, закрытая обувь.':
    'Зручний спортивний одяг, сонцезахисні окуляри, хустка, закрите взуття.',
  'Паспорта, купальники, пляжные полотенца, солнцезащитный крем.':
    'Паспорти, купальники, пляжні рушники, сонцезахисний крем.',
  'Фотоаппарат, купальник, пляжное полотенце, солнцезащитные очки.':
    'Фотоапарат, купальник, пляжний рушник, сонцезахисні окуляри.',
  'Оригинал паспорта, завтрак-ланчбокс из отеля, удобная обувь, шляпа от солнца.':
    'Оригінал паспорта, сухий сніданок (ланчбокс) з готелю, зручне взуття, капелюх від сонця.',
  'Карточка сертификации (Advanced Open Water, минимум 30 погружений), логбук, дайв-компьютер, купальник.':
    'Картка сертифікації (Advanced Open Water, мінімум 30 занурень), логбук, дайв-комп’ютер, купальник.',
  'Пляжное полотенце, солнцезащитный крем, очки, фотоаппарат.':
    'Пляжний рушник, сонцезахисний крем, окуляри, фотоапарат.',
  'Действующий оригинал паспорта, удобная обувь, фотоаппарат.':
    'Дійсний оригінал паспорта, зручне взуття, фотоапарат.',
  'Фотоаппарат, солнцезащитные очки.': 'Фотоапарат, сонцезахисні окуляри.',
  'Купальник, полотенце, походная обувь, шляпа от солнца, очки.':
    'Купальник, рушник, трекінгове взуття, капелюх від сонця, сонцезахисні окуляри.',
};

// Contextual lexer / transformer for tour text (titles, excerpts, descriptions, itineraries)
function ruToUk(text) {
  if (!text || typeof text !== 'string') return text;
  let s = text;

  // Direct phrase substitutions
  if (PHRASE_MAP[s]) return PHRASE_MAP[s];

  // Specific common patterns in tours
  const rules = [
    // Standard headings & concepts
    [/\bКрасное море\b/gi, 'Червоне море'],
    [/\bКрасного моря\b/gi, 'Червоного моря'],
    [/\bКрасному морю\b/gi, 'Червоному морю'],
    [/\bв Красном море\b/gi, 'в Червоному морі'],
    [/\bХургад[аеыу]\b/g, (m) => (m.endsWith('е') ? 'Хургаді' : m.endsWith('ы') ? 'Хургади' : m.endsWith('у') ? 'Хургаду' : 'Хургада')],
    [/\bШарм-эль-Шейх[аеу]?\b/g, (m) => (m.endsWith('е') ? 'Шарм-ель-Шейху' : m.endsWith('а') ? 'Шарм-ель-Шейха' : 'Шарм-ель-Шейх')],
    [/\bМарса-?Алам[аеу]?\b/g, (m) => (m.endsWith('е') ? 'Марса-Аламі' : m.endsWith('а') ? 'Марса-Алама' : 'Марса-Алам')],
    [/\bЭль-Гун[аеыу]\b/g, (m) => (m.endsWith('е') ? 'Ель-Гуні' : m.endsWith('ы') ? 'Ель-Гуни' : m.endsWith('у') ? 'Ель-Гуну' : 'Ель-Гуна')],
    [/\bЛуксор[аеу]?\b/g, (m) => (m.endsWith('е') ? 'Луксорі' : m.endsWith('а') ? 'Луксора' : 'Луксор')],
    [/\bКаир[аеу]?\b/g, (m) => (m.endsWith('е') ? 'Каїрі' : m.endsWith('а') ? 'Каїра' : 'Каїр')],
    [/\bАлександри[яеию]\b/g, (m) => (m.endsWith('и') ? 'Александрії' : m.endsWith('е') ? 'Александрії' : m.endsWith('ю') ? 'Александрію' : 'Александрія')],
    [/\bОранж Бэй\b/gi, 'Оранж Бей'],
    [/\bостров[аеу]? Гифтун\b/gi, (m) => (m.includes('Гифтун') ? m.replace('Гифтун', 'Гіфтун').replace('остров', 'острів') : m)],
    [/\bостров[аеу]?\b/g, (m) => (m === 'острова' ? 'острови' : m === 'острове' ? 'острові' : 'острів')],
    [/\bостровов\b/gi, 'островів'],
    [/\bбухт[аеыу]\b/g, (m) => (m.endsWith('е') ? 'бухті' : m.endsWith('ы') ? 'бухти' : m.endsWith('у') ? 'бухту' : 'бухта')],
    [/\bбухты\b/gi, 'бухти'],
    [/\bквадроцикл[а-я]*\b/gi, (m) => (m.includes('ах') ? 'квадроциклах' : m.includes('ы') || m.includes('ов') ? 'квадроцикли' : 'квадроцикл')],
    [/\bсафари\b/gi, 'сафарі'],
    [/\bснорклинг[а-я]*\b/gi, (m) => (m.includes('ом') ? 'снорклінгом' : m.includes('а') ? 'снорклінгу' : 'снорклінг')],
    [/\bдайвинг[а-я]*\b/gi, (m) => (m.includes('ом') ? 'дайвінгом' : m.includes('а') ? 'дайвінгу' : 'дайвінг')],
    [/\bдельфин[а-я]*\b/gi, (m) => (m.includes('ами') ? 'дельфінами' : m.includes('ов') || m.includes('ы') ? 'дельфіни' : 'дельфін')],
    [/\bчерепах[а-я]*\b/gi, (m) => (m.includes('ами') ? 'черепахами' : m.includes('и') ? 'черепахи' : m.includes('у') ? 'черепаху' : 'черепаха')],
    [/\bбедуинск[а-я]*\b/gi, (m) => (m.includes('ая') ? 'бедуїнська' : m.includes('ое') ? 'бедуїнське' : m.includes('ий') ? 'бедуїнський' : m.includes('ого') ? 'бедуїнського' : 'бедуїнський')],
    [/\bдеревн[яеию]\b/gi, (m) => (m.endsWith('е') ? 'селищі' : m.endsWith('и') ? 'селища' : 'селище')],
    [/\bэкскурси[яеию]\b/gi, (m) => (m.endsWith('и') ? 'екскурсії' : m.endsWith('е') ? 'екскурсії' : m.endsWith('ю') ? 'екскурсію' : 'екскурсія')],
    [/\bпутешестви[еяю]\b/gi, 'подорож'],
    [/\bкораллов[а-я]*\b/gi, 'коралових'],
    [/\bриф[а-я]*\b/gi, (m) => (m.includes('ах') ? 'рифах' : m.includes('ы') || m.includes('ов') ? 'рифи' : 'риф')],
    [/\bвключен[оаы]?\b/gi, 'включено'],
    [/\bне включен[оаы]?\b/gi, 'не включено'],
    [/\bтрансфер\b/gi, 'трансфер'],
    [/\bиз отеля и обратно\b/gi, 'з готелю та назад'],
    [/\bиз отеля\b/gi, 'з готелю'],
    [/\bв отель\b/gi, 'до готелю'],
    [/\bна весь день\b/gi, 'на цілий день'],
    [/\bполдня\b/gi, 'пів дня'],
    [/\bобед\b/gi, 'обід'],
    [/\bужин\b/gi, 'вечеря'],
    [/\bзавтрак\b/gi, 'сніданок'],
    [/\bнапитки\b/gi, 'напої'],
    [/\bснаряжение\b/gi, 'спорядження'],
    [/\bмаска и трубка\b/gi, 'маска та трубка'],
    [/\bласты\b/gi, 'ласти'],
    [/\bжилет[ы]?\b/gi, (m) => (m.endsWith('ы') ? 'жилети' : 'жилет')],
    [/\bспасательн[а-я]*\b/gi, 'рятувальні'],
    [/\bсертифицированн[а-я]*\b/gi, 'сертифікований'],
    [/\bпрофессиональн[а-я]*\b/gi, 'професійний'],
    [/\bрусскоязычн[а-я]*\b/gi, 'багатомовний'],
    [/\bлицензированн[а-я]*\b/gi, 'ліцензований'],
    [/\bгид[а-я]*\b/gi, (m) => (m.includes('ы') || m.includes('ов') ? 'гіди' : 'гід')],
    [/\bегиптолог[а-я]*\b/gi, 'єгиптолог'],
    [/\bбилет[а-я]*\b/gi, (m) => (m.includes('ы') || m.includes('ов') ? 'квитки' : 'квиток')],
    [/\bпирамид[а-я]*\b/gi, (m) => (m.includes('ы') || m.includes('ам') ? 'піраміди' : 'піраміда')],
    [/\bгробниц[а-я]*\b/gi, (m) => (m.includes('ы') || m.includes('ам') ? 'гробниці' : 'гробниця')],
    [/\bхрам[а-я]*\b/gi, (m) => (m.includes('ы') || m.includes('ов') ? 'храми' : 'храм')],
    [/\bНил[аеу]?\b/g, (m) => (m.endsWith('е') ? 'Нілі' : m.endsWith('а') ? 'Нілу' : 'Ніл')],
    [/\bДолина Царей\b/gi, 'Долина Царів'],
    [/\bДолина царей\b/gi, 'Долина царів'],
    [/\bДолина Цариц\b/gi, 'Долина Цариць'],
    [/\bКарнакск[а-я]* храм\b/gi, 'Карнакський храм'],
    [/\bхрам Хатшепсут\b/gi, 'храм Хатшепсут'],
    [/\bСфинкс[а-я]*\b/gi, 'Сфінкс'],
    [/\bБольшой Египетский Музей\b/gi, 'Великий Єгипетський Музей'],
    [/\bБольшой Египетский музей\b/gi, 'Великий Єгипетський музей'],
    [/\bбесплатная отмена\b/gi, 'безкоштовне скасування'],
    [/\bБесплатная отмена\b/gi, 'Безкоштовне скасування'],
    [/\bза 24 часа\b/gi, 'за 24 години'],
    [/\bза 48 часов\b/gi, 'за 48 годин'],
    [/\bдо начала тура\b/gi, 'до початку туру'],
    [/\bдо начала\b/gi, 'до початку'],
    [/\bвзросл[а-я]*\b/gi, 'дорослий'],
    [/\bдет[ея][йм]?\b/gi, 'діти'],
    [/\bчеловек[а-я]*\b/gi, 'осіб'],
    [/\bминут[а-я]*\b/gi, (m) => (m.includes('ы') ? 'хвилини' : m.includes('у') ? 'хвилину' : 'хвилин')],
    [/\bчас[а-я]*\b/gi, (m) => (m === 'часа' ? 'години' : m === 'часов' ? 'годин' : m === 'часу' ? 'годині' : 'година')],
    [/\bутренн[а-я]*\b/gi, 'ранковий'],
    [/\bвечерн[а-я]*\b/gi, 'вечірній'],
    [/\bзакат[а-я]*\b/gi, 'захід сонця'],
    [/\bрассвет[а-я]*\b/gi, 'світанок'],
    [/\bна закате\b/gi, 'на заході сонця'],
    [/\bна рассвете\b/gi, 'на світанку'],
    [/\bверблюд[а-я]*\b/gi, (m) => (m.includes('ах') ? 'верблюдах' : m.includes('е') ? 'верблюді' : 'верблюд')],
    [/\bкатание на верблюд[а-я]*\b/gi, 'катання на верблюді'],
    [/\bвосточн[а-я]* шоу\b/gi, 'східне шоу'],
    [/\bфольклорн[а-я]* шоу\b/gi, 'фольклорне шоу'],
    [/\bнаблюдение за звёздами\b/gi, 'спостереження за зорями'],
    [/\bподводн[а-я]* лодк[а-я]*\b/gi, 'напівпідводний човен'],
    [/\bбатискаф[а-я]*\b/gi, 'батискаф'],
    [/\bморск[а-я]* прогулк[а-я]*\b/gi, 'морська прогулянка'],
    [/\bморск[а-я]* день\b/gi, 'морський день'],
    [/\bкруиз[а-я]*\b/gi, 'круїз'],
    [/\bяхт[аеыу]\b/gi, (m) => (m.endsWith('е') ? 'яхті' : m.endsWith('ы') ? 'яхти' : m.endsWith('у') ? 'яхту' : 'яхта')],
    [/\bкатер[а-я]*\b/gi, (m) => (m.includes('е') ? 'катері' : 'катер')],
    [/\bскоростн[а-я]* катер\b/gi, 'швидкісний катер'],
    [/\bпляж[а-я]*\b/gi, (m) => (m.includes('е') ? 'пляжі' : 'пляж')],
    [/\bпляжный день\b/gi, 'пляжний день'],
    [/\bсолнц[еа-я]*\b/gi, 'сонце'],
    [/\bсолнцезащитн[а-я]*\b/gi, 'сонцезахисний'],
    [/\bочки\b/gi, 'окуляри'],
    [/\bполотенц[а-я]*\b/gi, (m) => (m.includes('а') ? 'рушники' : 'рушник')],
    [/\bкупальник[а-я]*\b/gi, 'купальник'],
    [/\bудобн[а-я]* обувь\b/gi, 'зручне взуття'],
    [/\bпаспорт[а-я]*\b/gi, 'паспорт'],
    [/\bвода\b/gi, 'вода'],
    [/\bчто взять с собой\b/gi, 'що взяти з собою'],
    [/\bЧто взять с собой\b/gi, 'Що взяти з собою'],
    [/\bс собой\b/gi, 'із собою'],
    [/\bна борту\b/gi, 'на борту'],
    [/\bшведский стол\b/gi, 'шведський стіл'],
    [/\bсемейное сафари\b/gi, 'сімейне сафарі'],
    [/\bСемейное сафари\b/gi, 'Сімейне сафарі'],
    [/\bкоролевское сафари\b/gi, 'королівське сафарі'],
    [/\bКоролевское сафари\b/gi, 'Королівське сафарі'],
    [/\bсупер-сафари\b/gi, 'супер-сафарі'],
    [/\bСупер-сафари\b/gi, 'Супер-сафарі'],
    [/\bмега-сафари\b/gi, 'мега-сафарі'],
    [/\bМега-сафари\b/gi, 'Мега-сафарі'],
    [/\bмини-группа\b/gi, 'міні-група'],
    [/\bМини-группа\b/gi, 'Міні-група'],
    [/\bвоздушный шар\b/gi, 'повітряна куля'],
    [/\bполет на воздушном шаре\b/gi, 'політ на повітряній кулі'],
    [/\bПолет на воздушном шаре\b/gi, 'Політ на повітряній кулі'],
    [/\bплавание с дельфинами\b/gi, 'плавання з дельфінами'],
    [/\bПлавание с дельфинами\b/gi, 'Плавання з дельфінами'],
    [/\bфотосессия с дельфинами\b/gi, 'фотосесія з дельфінами'],
    [/\bтурецкая баня\b/gi, 'турецька лазня'],
    [/\bмарокканская баня\b/gi, 'марокканська лазня'],
    [/\bмассаж всего тела\b/gi, 'масаж усього тіла'],
    [/\bмассаж\b/gi, 'масаж'],
    [/\bхаммам\b/gi, 'хамам'],
    [/\bсоляные озёра\b/gi, 'соляні озера'],
    [/\bСоляные озёра\b/gi, 'Соляні озера'],
  ];

  for (const [pattern, replacement] of rules) {
    s = s.replace(pattern, replacement);
  }

  return s;
}

async function main() {
  console.log('🚀 Starting catalog Ukrainian translation process...');

  // 1. Update Destinations
  console.log('\n--- 1. Updating Destinations ---');
  const destinations = await prisma.destination.findMany();
  let destCount = 0;
  for (const dest of destinations) {
    const existing = dest.translations || {};
    const ukData = DESTINATION_TRANSLATIONS_UK[dest.slug] || {
      name: dest.name,
      description: dest.description || '',
    };
    const updated = {
      ...existing,
      uk: ukData,
    };
    await prisma.destination.update({
      where: { id: dest.id },
      data: { translations: updated },
    });
    destCount++;
  }
  console.log(`✅ Updated ${destCount} destinations with Ukrainian translations.`);

  // 2. Update Blog Posts
  console.log('\n--- 2. Updating Blog Posts ---');
  const posts = await prisma.blogPost.findMany();
  let blogCount = 0;
  for (const post of posts) {
    const existing = post.translations || {};
    const blogData = BLOG_TRANSLATIONS[post.slug];
    if (blogData) {
      // Merge all provided languages (uk + any missing for p5/p6)
      const merged = { ...existing };
      for (const [lang, val] of Object.entries(blogData)) {
        merged[lang] = val;
      }
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { translations: merged },
      });
      blogCount++;
    }
  }
  console.log(`✅ Updated ${blogCount} blog posts with comprehensive translations.`);

  // 3. Update Tours
  console.log('\n--- 3. Updating Tours ---');
  const tours = await prisma.tour.findMany();
  let tourCount = 0;

  for (const tour of tours) {
    const t = tour.translations || {};
    const ru = t.ru || {};
    const en = t.en || {};

    const ukTitle = ruToUk(ru.title || en.title || '');
    const ukExcerpt = ruToUk(ru.cardExcerpt || en.cardExcerpt || ru.tagline || en.tagline || '');
    const ukDescription = ruToUk(ru.description || en.description || '');
    const ukWhatToBring = ruToUk(ru.whatToBring || en.whatToBring || '');
    const ukPickup = ruToUk(ru.pickupDescription || en.pickupDescription || '');
    const ukCancellation = ruToUk(ru.cancellationPolicy || en.cancellationPolicy || 'Безкоштовне скасування за 24 години до початку туру.');

    const ukHighlights = (ru.highlights || en.highlights || []).map((h) => ruToUk(h));
    const ukInclusions = (ru.inclusions || en.inclusions || []).map((i) => ruToUk(i));
    const ukExclusions = (ru.exclusions || en.exclusions || []).map((e) => ruToUk(e));
    const ukCancellationPolicies = (ru.cancellationPolicies || en.cancellationPolicies || [ukCancellation]).map((c) => ruToUk(c));

    const ukItinerary = (ru.itinerary || en.itinerary || []).map((step) => ({
      title: ruToUk(step.title),
      timeTag: step.timeTag || '',
      description: ruToUk(step.description),
    }));

    const ukTourData = {
      title: ukTitle,
      cardExcerpt: ukExcerpt,
      description: ukDescription,
      highlights: ukHighlights,
      inclusions: ukInclusions,
      exclusions: ukExclusions,
      whatToBring: ukWhatToBring,
      pickupDescription: ukPickup,
      cancellationPolicy: ukCancellation,
      cancellationPolicies: ukCancellationPolicies,
      itinerary: ukItinerary,
    };

    const updatedTranslations = {
      ...t,
      uk: ukTourData,
    };

    await prisma.tour.update({
      where: { id: tour.id },
      data: { translations: updatedTranslations },
    });
    tourCount++;
  }
  console.log(`✅ Updated ${tourCount} tours with Ukrainian translations.`);

  console.log('\n🎉 All catalog translations for Ukrainian complete!');
}

main()
  .catch((e) => {
    console.error('Error during catalog translation:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
