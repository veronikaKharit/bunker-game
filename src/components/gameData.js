// Данные катастроф
export const disasters = [
  {
    id: 1,
    title: "Ядерная зима",
    description: "После глобального ядерного конфликта солнце закрыто пеплом. Температура упала до -50°C. Радиация делает поверхности непригодными для жизни."
  },
  {
    id: 2,
    title: "Зомби-апокалипсис",
    description: "Неизвестный вирус превращает людей в агрессивных зомби. Заражение происходит через укус. Выжившие прячутся в убежищах."
  },
  {
    id: 3,
    title: "Пандемия Omega",
    description: "Смертельный вирус с 95% летальностью распространился по миру. Выжившие имеют естественный иммунитет, но являются переносчиками."
  }
];

// Данные бункеров
export const bunkers = [
  {
    id: 1,
    size: "50 кв.м",
    time: "5 лет",
    food: "Консервы на 3 года",
    features: ["Генератор кислорода", "Система очистки воды", "Медпункт", "Библиотека"]
  },
  {
    id: 2,
    size: "120 кв.м",
    time: "10 лет",
    food: "Гидропонные фермы",
    features: ["Геотермальный источник энергии", "Лаборатория", "Тренажерный зал", "Оружейная комната"]
  },
  {
    id: 3,
    size: "200 кв.м",
    time: "20 лет",
    food: "Автоматические фермы",
    features: ["Искусственный интеллект", "Медлаборатория", "Цех 3D-печати", "Кинотеатр"]
  }
];

// Характеристики игроков
export const traits = {
  gender: ["Мужской", "Женский"],
  bodyType: ["Худощавый", "Спортивный", "Полный", "Мускулистый", "Обычный"],
  humanTrait: ["Добрый", "Хитрый", "Агрессивный", "Эгоистичный", "Альтруист"],
  profession: ["Врач", "Инженер", "Учитель", "Повар", "Солдат", "Ученый"],
  health: ["Здоров", "Астма", "Диабет", "Инвалидность", "Сердечное заболевание"],
  hobby: ["Садоводство", "Чтение", "Игра на гитаре", "Шахматы", "Рисование"],
  phobia: ["Арахнофобия", "Клаустрофобия", "Акрофобия", "Агорафобия"],
  inventory: ["Аптечка", "Топор", "Фонарик", "Радио", "Спальный мешок"],
  backpack: ["Вода", "Консервы", "Нож", "Карта", "Компас"],
  additionalInfo: ["Бывший заключенный", "Аллергия на пыль", "Вегетарианец", "Беременна"],
  special: ["Лидер", "Выживальщик", "Сапер", "Повар-гурман"]
};

// Генератор случайных характеристик
export const generatePlayerTraits = () => {
  return {
    gender: traits.gender[Math.floor(Math.random() * traits.gender.length)],
    bodyType: traits.bodyType[Math.floor(Math.random() * traits.bodyType.length)],
    humanTrait: traits.humanTrait[Math.floor(Math.random() * traits.humanTrait.length)],
    profession: traits.profession[Math.floor(Math.random() * traits.profession.length)],
    health: traits.health[Math.floor(Math.random() * traits.health.length)],
    hobby: traits.hobby[Math.floor(Math.random() * traits.hobby.length)],
    phobia: traits.phobia[Math.floor(Math.random() * traits.phobia.length)],
    inventory: traits.inventory[Math.floor(Math.random() * traits.inventory.length)],
    backpack: traits.backpack[Math.floor(Math.random() * traits.backpack.length)],
    additionalInfo: traits.additionalInfo[Math.floor(Math.random() * traits.additionalInfo.length)],
    special: traits.special[Math.floor(Math.random() * traits.special.length)]
  };
};