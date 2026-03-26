
import { Dish, Language } from './types';

export const LANGUAGES: Language[] = [
  'English',
  'Chinese (Simplified)',
  'Japanese',
  'Korean',
  'Spanish',
  'French',
  'Thai',
  'Vietnamese',
  'German',
  'Italian'
];

export const NATIVE_LANGUAGE_NAMES: Record<Language, string> = {
  'English': 'English',
  'Chinese (Simplified)': '简体中文',
  'Japanese': '日本語',
  'Korean': '한국어',
  'Spanish': 'Español',
  'French': 'Français',
  'Thai': 'ไทย',
  'Vietnamese': 'Tiếng Việt',
  'German': 'Deutsch',
  'Italian': 'Italiano'
};


export const MOCK_RESULTS: Dish[] = [
  {
    id: '1',
    name: 'Tom Yum Goong',
    originalName: '冬阴功汤',
    description: 'A famous Thai soup with river prawns, mushrooms, and lemongrass. Distinct hot and sour flavor with a creamy coconut milk base.',
    image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b485c?auto=format&fit=crop&q=80&w=800',
    tags: ['Sour', 'Spicy', 'Creamy'],
    allergens: [],
    spiceLevel: 'Hot',
    category: 'Soup'
  }
];

export const MOCK_SAVED: Dish[] = [];

export const COMMON_ALLERGENS = [
    'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Shellfish', 'Fish', 'Soy', 'Wheat/Gluten', 'Sesame'
];

// Translations for the Chef Card
export const CHEF_CARD_DATA: Record<Language, { 
    title: string; 
    allergyWarning: string; 
    avoidText: string; 
    thankYou: string;
    allergens: Record<string, string>;
}> = {
    'English': {
        title: 'Information Card',
        allergyWarning: 'I have a severe allergy to:',
        avoidText: 'Please note my dietary preferences:',
        thankYou: 'Thank you for your help.',
        allergens: { 'Peanuts': 'Peanuts', 'Tree Nuts': 'Tree Nuts', 'Dairy': 'Dairy', 'Eggs': 'Eggs', 'Shellfish': 'Shellfish', 'Fish': 'Fish', 'Soy': 'Soy', 'Wheat/Gluten': 'Wheat/Gluten', 'Sesame': 'Sesame' }
    },
    'Chinese (Simplified)': {
        title: '信息卡',
        allergyWarning: '我对以下食物严重过敏：',
        avoidText: '请注意我的饮食偏好：',
        thankYou: '谢谢您的配合。',
        allergens: { 'Peanuts': '花生', 'Tree Nuts': '坚果', 'Dairy': '乳制品', 'Eggs': '蛋类', 'Shellfish': '甲壳类/贝类', 'Fish': '鱼类', 'Soy': '大豆', 'Wheat/Gluten': '小麦/麸质', 'Sesame': '芝麻' }
    },
    'Japanese': {
        title: '情報カード',
        allergyWarning: '私は以下の食品に重度のアレルギーがあります：',
        avoidText: '私の食事の好みにご注意ください：',
        thankYou: 'ご協力ありがとうございます。',
        allergens: { 'Peanuts': 'ピーナッツ', 'Tree Nuts': 'ナッツ類', 'Dairy': '乳製品', 'Eggs': '卵', 'Shellfish': '甲殻類・貝類', 'Fish': '魚介類', 'Soy': '大豆', 'Wheat/Gluten': '小麦・グルテン', 'Sesame': 'ゴマ' }
    },
    'Korean': {
        title: '정보 카드',
        allergyWarning: '저는 다음 음식에 심한 알레르기가 있습니다:',
        avoidText: '제 식사 선호도를 참고해 주세요:',
        thankYou: '협조해 주셔서 감사합니다.',
        allergens: { 'Peanuts': '땅콩', 'Tree Nuts': '견과류', 'Dairy': '유제품', 'Eggs': '달걀', 'Shellfish': '갑각류/조개', 'Fish': '생선', 'Soy': '콩/대두', 'Wheat/Gluten': '밀/글루텐', 'Sesame': '참깨' }
    },
    'Spanish': {
        title: 'Tarjeta de Información',
        allergyWarning: 'Tengo una alergia grave a:',
        avoidText: 'Por favor, tenga en cuenta mis preferencias dietéticas:',
        thankYou: 'Gracias por su ayuda.',
        allergens: { 'Peanuts': 'Cacahuetes', 'Tree Nuts': 'Frutos secos', 'Dairy': 'Lácteos', 'Eggs': 'Huevos', 'Shellfish': 'Mariscos', 'Fish': 'Pescado', 'Soy': 'Soja', 'Wheat/Gluten': 'Trigo/Gluten', 'Sesame': 'Sésamo' }
    },
    'French': {
        title: 'Carte d\'Information',
        allergyWarning: 'J\'ai une allergie sévère à :',
        avoidText: 'Veuillez noter mes préférences alimentaires :',
        thankYou: 'Merci de votre aide.',
        allergens: { 'Peanuts': 'Arachides', 'Tree Nuts': 'Fruits à coque', 'Dairy': 'Produits laitiers', 'Eggs': 'Œufs', 'Shellfish': 'Crustacés/Coquillages', 'Fish': 'Poisson', 'Soy': 'Soja', 'Wheat/Gluten': 'Blé/Gluten', 'Sesame': 'Sésame' }
    },
    'Thai': {
        title: 'บัตรข้อมูล',
        allergyWarning: 'ฉันแพ้อาหารต่อไปนี้อย่างรุนแรง:',
        avoidText: 'โปรดพิจารณาความพอใจในการรับประทานอาหารของฉัน:',
        thankYou: 'ขอบคุณสำหรับความช่วยเหลือ',
        allergens: { 'Peanuts': 'ถั่วลิสง', 'Tree Nuts': 'ถั่วเปลือกแข็ง', 'Dairy': 'นม/ผลิตภัณฑ์นม', 'Eggs': 'ไข่', 'Shellfish': 'สัตว์มีเปลือก/อาหารทะเล', 'Fish': 'ปลา', 'Soy': 'ถั่วเหลือง', 'Wheat/Gluten': 'ข้าวสาลี/กลูเตน', 'Sesame': 'งา' }
    },
    'Vietnamese': {
        title: 'Thẻ Thông Tin',
        allergyWarning: 'Tôi bị dị ứng nghiêm trọng với:',
        avoidText: 'Vui lòng lưu ý các sở thích ăn uống của tôi:',
        thankYou: 'Cảm ơn sự giúp đỡ của bạn.',
        allergens: { 'Peanuts': 'Đậu phộng', 'Tree Nuts': 'Các loại hạt', 'Dairy': 'Sản phẩm từ sữa', 'Eggs': 'Trứng', 'Shellfish': 'Động vật có vỏ', 'Fish': 'Cá', 'Soy': 'Đậu nành', 'Wheat/Gluten': 'Lúa mì/Gluten', 'Sesame': 'Mè' }
    },
    'German': {
        title: 'Informationskarte',
        allergyWarning: 'Ich habe eine schwere Allergie gegen:',
        avoidText: 'Bitte beachten Sie meine Ernährungspräferenzen:',
        thankYou: 'Vielen Dank für Ihre Hilfe.',
        allergens: { 'Peanuts': 'Erdnüsse', 'Tree Nuts': 'Schalenfrüchte', 'Dairy': 'Milchprodukte', 'Eggs': 'Eier', 'Shellfish': 'Krebstiere/Muscheln', 'Fish': 'Fisch', 'Soy': 'Soja', 'Wheat/Gluten': 'Weizen/Gluten', 'Sesame': 'Sesam' }
    },
    'Italian': {
        title: 'Scheda Informativa',
        allergyWarning: 'Ho una grave allergia a:',
        avoidText: 'Si prega di notare le mie preferenze alimentari:',
        thankYou: 'Grazie per il vostro aiuto.',
        allergens: { 'Peanuts': 'Arachidi', 'Tree Nuts': 'Frutta a guscio', 'Dairy': 'Latticini', 'Eggs': 'Uova', 'Shellfish': 'Crostacei/Molluschi', 'Fish': 'Pesce', 'Soy': 'Soia', 'Wheat/Gluten': 'Grano/Glutine', 'Sesame': 'Sesamo' }
    }
};
