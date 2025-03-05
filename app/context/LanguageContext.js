import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

const LanguageContext = createContext();

export const translations = {
  en: {
    services: "Services",
    home: {
      searchPlaceholder: "Search for services...",
      categories: "Categories",
      nearbyServices: "Nearby Services",
      viewAll: "View All",
      orders:{
        title: "Orders",
        status:{
          pending: "Pending",
          accepted: "Accepted",
          rejected: "Rejected"
        },
        petInfo: "Pet Information",
        services: "Services",
      },
      ordersBadge: "New",
      featuredProducts: "Featured Products",
      services: "Services",
      categoryNames: {
        grooming: "Grooming",
        boarding: "Boarding",
        walking: "Walking",
        training: "Training",
        veterinary: "Veterinary",
        daycare: "Daycare",
      },
      filter: {
        title: "Filter",
        sort: "Sort By",
        sortOptions: {
          most_popular: "Most Popular",
          recommended: "Recommended",
          nearest: "Nearest",
          rating: "Top Rated",
          priceHigh: "Price: High to Low",
          priceLow: "Price: Low to High",
        },
        apply: "Apply Filters",
      },
      location: {
        setLocation: "Set your location",
        selectLocation: "Select Location",
        searchPlaceholder: "Search for area, street name...",
        confirmLocation: "Confirm Location",
        currentLocation: "Use Current Location",
        savedLocations: "Saved Locations",
        nameAddress: "Name this address (e.g. Home, Work)",
        saveLocation: "Save Location",
        setAsDefault: "Set as Default",
        setDeliveryLocation: "Set Delivery Location",
        savedAddresses: {
          home: "Home",
          work: "Work",
          gym: "Gym"
        },
        addNewAddress: "Add New Address",
        deliveryAddress: "Delivery Address",
        defaultAddress: "Default",
        deleteAddress: "Delete Address",
        addressNamePlaceholder: "Enter address name (e.g., Home, Office, Gym)"
      }
    },
    provider: {
      orders: {
        title: "Order Requests",
        status: {
          pending: "Pending",
          accepted: "Accepted",
          rejected: "Rejected"
        },
        petInfo: "Pet Information",
        services: "Services",
        notes: "Customer Notes",
        total: "Total Amount",
        accept: "Accept Order",
        reject: "Reject Order",
        acceptTitle: "Accept Order",
        acceptMessage: "Are you sure you want to accept this order?",
        rejectTitle: "Reject Order",
        rejectMessage: "Are you sure you want to reject this order?",
        service: "Service",
        selectServices: "Select Services",
        status: {
          open: "Open",
          closed: "Closed"
        }
      }
    },
    common: {
      cancel: "Cancel",
      confirm: "Confirm",
      menu: {
        updateProfile: "Update Profile",
        language: "Language",
        wallet: "Wallet",
        contactUs: "Contact Us",
        privacyPolicy: "Privacy Policy",
        logout: "Logout",
        version: "Version",
        myOrders: "My Orders",
        changeLanguage: "Change Language"
      }
    },
    login: {
      welcome: "Welcome to PawCare",
      welcomeDescription: "Your pets deserve the best care. Let's get started! 🐾",
      phoneNumber: "Phone Number",
      sendCode: "Send Code",
      verificationTitle: "Enter your Verification Code",
      verifyButton: "Verify",
      resendCode: "I didn't receive the code?",
      resendLink: "Send again",
      continueWith: "or continue with",
      noAccount: "Don't have an account?",
      signupLink: "Sign Up",
      termsText: "By continuing, you agree to our",
      termsLink: "Terms of Service",
      privacyLink: "Privacy Policy",
      and: "and",
      menu: {
        updateProfile: "Update Profile",
        language: "Language",
        wallet: "Wallet",
        contactUs: "Contact Us",
        privacyPolicy: "Privacy Policy",
        logout: "Logout",
        version: "Version",
        myOrders: "My Orders",
        changeLanguage: "Change Language"
      }
    },
    signup: {
      quote: "Every pet deserves a loving home",
      phoneTitle: "Enter your phone number",
      phoneDescription: "We'll send you a verification code",
      nameTitle: "What's your name?",
      nameDescription: "Let us know how to address you",
      namePlaceholder: "Enter your full name",
      cityTitle: "Select your city",
      cityDescription: "Help us show relevant services near you",
      verifyTitle: "Verify your number",
      verifyDescription: "Enter the 4-digit code we sent to your phone number",
      completeSignup: "Complete Signup",
      next: "Next"
    },
    search: {
      title: "Search",
      searchPlaceholder: "Search for pets products...",
      recentSearches: "Recent Searches",
      popularSearches: "Popular Searches",
      noResults: "No results found",
      cancel: "Cancel",
      rating: {
        title: "Rate Your Experience",
        subtitle: "How was your service?",
        totalAmount: "Total Amount",
        tapToRate: "Tap to rate",
        excellent: "Excellent!",
        veryGood: "Very Good",
        good: "Good",
        fair: "Fair",
        poor: "Poor",
        commentPlaceholder: "Share your experience (optional)",
        submitButton: "Submit Rating"
      },
      orders: {
        title: "My Orders",
        all: "All",
        stats: {
          active: "Active",
          completed: "Completed",
          total: "Total",
          cancelled: "Cancelled", 
          pending: "Pending",
          confirmed: "Confirmed",
          in_progress: "In Progress",
          completed: "Completed",
          cancelled: "Cancelled"
        },
        status: {
          confirmed: "Confirmed",
          in_progress: "In Progress",
          completed: "Completed",
          cancelled: "Cancelled",
          pending: "Pending",
          accepted: "Accepted",
          rejected: "Rejected"
        },
        location: "Location",
        date: "Date",
        time: "Time",
        price: "Price",
        services: "Services",
      }
    },
    cart: {
      title: "Cart",
      empty: "Your cart is empty",
      shopButton: "Start Shopping",
      total: "Total",
      placeOrder: "Place Order",
      checkout: "Checkout",
      currency: "SAR",
      continueShopping: "Continue Shopping"
    },
    orderDetails: {
      title: "Order",
      serviceLocation: "Service Location",
      appointmentTime: "Appointment Time",
      services: "Services",
      paymentDetails: "Payment Details",
      method: "Method",
      status: "Status",
      totalAmount: "Total Amount",
      openInMaps: "Open in Maps",
      cancelOrder: "Cancel Order",
      startService: "Start Service",
      completeService: "Complete Service",
      viewReceipt: "View Receipt",
      quantity: "Qty"
    },
    products: {
      title: "Products",
      searchPlaceholder: "Search products...",
      categories: "Categories",
      filters: "Filters",
      sort: "Sort",
      addToCart: "Add to Cart",
      outOfStock: "Out of Stock",
      description: "Description",
      specifications: "Specifications",
      reviews: "Reviews",
      relatedProducts: "Related Products",
      quantity: "Quantity",
      inStock: "In Stock",
      brand: "Brand",
      category: "Category",
      weight: "Weight",
      price: "Price",
      discount: "Discount",
      rating: {
        reviews: "Reviews",
        noReviews: "No reviews yet"
      },
      sortOptions: {
        most_popular: "Most Popular",
        newest: "Newest",
        price_low: "Price: High to Low",
        price_high: "Price: Low to High",
        popularity: "Popularity",
        rating: "Rating"
      },
     
    },
    dateTimeSheet: {
      selectDateTime: "Select Date & Time",
      availableTimeSlots: "Available Time Slots",
      confirm: "Confirm"
    },
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated",
      introduction: "Welcome to PetMe. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our pet services platform.",
      sections: {
        information: {
          title: "Information We Collect",
          content: [
            "Personal Information: Name, email address, phone number, and profile picture.",
            "Pet Information: Details about your pets including name, breed, age, and medical history.",
            "Location Data: Your current location to show nearby pet services and for delivery purposes.",
            "Payment Information: Payment method details and transaction history.",
            "Usage Data: How you interact with our app, including services booked and preferences."
          ]
        },
        usage: {
          title: "How We Use Your Information",
          content: [
            "To provide and improve our pet services",
            "To process your bookings and payments",
            "To communicate with you about your orders and services",
            "To send you relevant updates and promotional content",
            "To ensure the safety and security of our platform",
            "To comply with legal obligations"
          ]
        },
        sharing: {
          title: "Information Sharing",
          content: [
            "With service providers to fulfill your orders",
            "With payment processors to handle transactions",
            "With third-party services for app functionality",
            "When required by law or to protect our rights"
          ]
        },
        security: {
          title: "Data Security",
          content: [
            "We implement industry-standard security measures",
            "Your data is encrypted during transmission",
            "Regular security assessments and updates",
            "Limited access to personal information by authorized personnel"
          ]
        },
        rights: {
          title: "Your Rights",
          content: [
            "Access your personal information",
            "Correct inaccurate data",
            "Request deletion of your data",
            "Opt-out of marketing communications",
            "Control app permissions (location, camera, etc.)"
          ]
        },
        children: {
          title: "Children's Privacy",
          content: [
            "Our services are not intended for children under 13",
            "We do not knowingly collect information from children",
            "Parents can request removal of children's information"
          ]
        },
        updates: {
          title: "Updates to Privacy Policy",
          content: [
            "We may update this policy periodically",
            "You will be notified of significant changes",
            "Continued use of the app implies acceptance of changes"
          ]
        },
        contact: {
          title: "Contact Us",
          content: [
            "Email: privacy@petme.com",
            "Phone: +966 123 456 789",
            "Address: Riyadh, Saudi Arabia"
          ]
        }
      }
    }
  },
  ar: {
    services: "الخدمات",
    home: {
      searchPlaceholder: "ابحث عن الخدمات...",
      categories: "الفئات",
      nearbyServices: "الخدمات القريبة",
      viewAll: "عرض الكل",
      orders:{
        title: "Orders",
        status:{
          pending: "Pending",
          accepted: "Accepted",
          rejected: "Rejected"
        },
        petInfo: "Pet Information",
        services: "Services",
      },
      ordersBadge: "جديد",
      featuredProducts: "المنتجات المميزة",
      services: "الخدمات",
      categoryNames: {
        grooming: "التجميل",
        boarding: "الإيواء",
        walking: "المشي",
        training: "التدريب",
        veterinary: "الطب البيطري",
        daycare: "الرعاية النهارية",
      },
      filter: {
        title: "تصفية",
        sort: "ترتيب حسب",
        sortOptions: {
          most_popular: "الأكثر شعبية",
          recommended: "موصى به",
          nearest: "الأقرب",
          rating: "الأعلى تقييماً",
          priceHigh: "السعر: من الأعلى إلى الأقل",
          priceLow: "السعر: من الأقل إلى الأعلى",
        },
        apply: "تطبيق التصفية",
      },
      location: {
        setLocation: "حدد موقعك",
        selectLocation: "اختر الموقع",
        searchPlaceholder: "ابحث عن المنطقة، اسم الشارع...",
        confirmLocation: "تأكيد الموقع",
        currentLocation: "استخدم الموقع الحالي",
        savedLocations: "المواقع المحفوظة",
        nameAddress: "اسم هذا العنوان (مثل المنزل، العمل)",
        saveLocation: "حفظ الموقع",
        setDeliveryLocation: "تحديد موقع التوصيل",
        savedAddresses: {
          home: "المنزل",
          work: "العمل",
          gym: "النادي الرياضي"
        },
        addNewAddress: "إضافة عنوان جديد",
        deliveryAddress: "عنوان التوصيل",
        defaultAddress: "الافتراضي",
        deleteAddress: "حذف العنوان",
        addressNamePlaceholder: "أدخل اسم العنوان (مثل المنزل، المكتب، النادي)"
      }
    },
    provider: {
      orders: {
        title: "طلبات الخدمة",
        status: {
          pending: "قيد الانتظار",
          accepted: "مقبول",
          rejected: "مرفوض"
        },
        petInfo: "معلومات الحيوان الأليف",
        services: "الخدمات",
        notes: "ملاحظات العميل",
        total: "المبلغ الإجمالي",
        accept: "قبول الطلب",
        reject: "رفض الطلب",
        acceptTitle: "قبول الطلب",
        acceptMessage: "هل أنت متأكد من قبول هذا الطلب؟",
        rejectTitle: "رفض الطلب",
        rejectMessage: "هل أنت متأكد من رفض هذا الطلب؟",
        service: "خدمة",
        selectServices: "اختر الخدمات",
        status: {
          open: "مفتوح",
          closed: "مغلق"
        }
      }
    },
    common: {
      cancel: "إلغاء",
      confirm: "تأكيد",
      menu: {
        updateProfile: "تحديث الملف الشخصي",
        language: "اللغة",
        wallet: "المحفظة",
        contactUs: "اتصل بنا",
        privacyPolicy: "سياسة الخصوصية",
        logout: "تسجيل الخروج",
        version: "الإصدار",
        myOrders: "طلباتي",
        changeLanguage: "تغيير اللغة"
      }
    },
    login: {
      welcome: "مرحباً بك في PawCare",
      welcomeDescription: "حيواناتك الأليفة تستحق أفضل رعاية. هيا نبدأ! 🐾",
      phoneNumber: "رقم الهاتف",
      sendCode: "إرسال الرمز",
      verificationTitle: "أدخل رمز التحقق",
      verifyButton: "تحقق",
      resendCode: "لم يصلني الرمز؟",
      resendLink: "إرسال مرة أخرى",
      continueWith: "أو تابع باستخدام",
      noAccount: "ليس لديك حساب؟",
      signupLink: "تسجيل جديد",
      termsText: "بالمتابعة، فإنك توافق على",
      termsLink: "شروط الخدمة",
      privacyLink: "سياسة الخصوصية",
      and: "و",
      menu: {
        updateProfile: "تحديث الملف الشخصي",
        language: "اللغة",
        wallet: "المحفظة",
        contactUs: "اتصل بنا",
        privacyPolicy: "سياسة الخصوصية",
        logout: "تسجيل الخروج",
        version: "الإصدار",
        myOrders: "طلباتي",
        changeLanguage: "تغيير اللغة"
      }
    },
    signup: {
      quote: "كل حيوان أليف يستحق منزلاً محباً",
      phoneTitle: "أدخل رقم هاتفك",
      phoneDescription: "سنرسل لك رمز التحقق",
      nameTitle: "ما اسمك؟",
      nameDescription: "دعنا نعرف كيف نخاطبك",
      namePlaceholder: "أدخل اسمك الكامل",
      cityTitle: "اختر مدينتك",
      cityDescription: "ساعدنا في عرض الخدمات القريبة منك",
      verifyTitle: "تحقق من رقمك",
      verifyDescription: "أدخل الرمز المكون من 4 أرقام الذي أرسلناه إلى هاتفك",
      completeSignup: "إكمال التسجيل",
      next: "التالي"
    },
    search: {
      title: "بحث",
      searchPlaceholder: "ابحث عن منتجات الحيوانات الأليفة...",
      recentSearches: "عمليات البحث الأخيرة",
      popularSearches: "عمليات البحث الشائعة",
      noResults: "لا توجد نتائج",
      cancel: "إلغاء",
      rating: {
        title: "قيم تجربتك",
        subtitle: "كيف كانت الخدمة؟",
        totalAmount: "المبلغ الإجمالي",
        tapToRate: "اضغط للتقييم",
        excellent: "ممتاز!",
        veryGood: "جيد جداً",
        good: "جيد",
        fair: "مقبول",
        poor: "ضعيف",
        commentPlaceholder: "شاركنا تجربتك (اختياري)",
        submitButton: "إرسال التقييم"
      },
      orders: {
        title: "طلباتي",
        all: "الكل",
        stats: {
          active: "نشط",
          completed: "مكتمل",
          total: "المجموع",
          cancelled: "ملغي",
          pending: "قيد الانتظار",
          confirmed: "مؤكد",
          in_progress: "قيد التنفيذ",
          completed: "مكتمل"
        },
        status: {
          confirmed: "مؤكد",
          in_progress: "قيد التنفيذ",
          completed: "مكتمل",
          cancelled: "ملغي",
          pending: "قيد الانتظار",
          accepted: "مقبول",
          rejected: "مرفوض"
        },
        location: "الموقع",
        date: "التاريخ",
        time: "الوقت",
        price: "السعر",
        services: "الخدمات",
      
      }
    },
    orderDetails: {
      title: "طلب",
      serviceLocation: "موقع الخدمة",
      appointmentTime: "موعد الخدمة",
      services: "الخدمات",
      paymentDetails: "تفاصيل الدفع",
      method: "طريقة الدفع",
      status: "الحالة",
      totalAmount: "المبلغ الإجمالي",
      openInMaps: "فتح في الخرائط",
      cancelOrder: "إلغاء الطلب",
      startService: "بدء الخدمة",
      completeService: "إكمال الخدمة",
      viewReceipt: "عرض الفاتورة",
      quantity: "الكمية"
    },
    products: {
      title: "المنتجات",
      searchPlaceholder: "البحث عن المنتجات...",
      categories: "الفئات",
      filters: "التصفية",
      sort: "الترتيب",
      addToCart: "أضف إلى السلة",
      outOfStock: "نفذت الكمية",
      description: "الوصف",
      specifications: "المواصفات",
      reviews: "التقييمات",
      relatedProducts: "منتجات مشابهة",
      quantity: "الكمية",
      inStock: "متوفر",
      brand: "العلامة التجارية",
      category: "الفئة",
      weight: "الوزن",
      price: "السعر",
      discount: "الخصم",
      rating: {
        reviews: "تقييمات",
        noReviews: "لا توجد تقييمات بعد"
      },
      sortOptions: {
        most_popular: "الأكثر شعبية",
        newest: "الأحدث",
        price_low: "السعر: من الأقل إلى الأعلى",
        price_high: "السعر: من الأعلى إلى الأقل",
        popularity: "الأكثر شعبية",
        rating: "الأعلى تقييماً"
      },
      cart: {
        title: "سلة التسوق",
        empty: "سلة التسوق فارغة",
        shopButton: "ابدأ التسوق",
        total: "المجموع",
        placeOrder: "إنشاء الطلب",
        checkout: "الدفع",
        currency: "ريال",
        continueShopping: "مواصلة التسوق"
      }
    },
    dateTimeSheet: {
      selectDateTime: "اختر التاريخ والوقت",
      availableTimeSlots: "الأوقات المتاحة",
      confirm: "تأكيد"
    },
    privacy: {
      title: "سياسة الخصوصية",
      lastUpdated: "آخر تحديث",
      introduction: "مرحباً بك في PetMe. نحن ملتزمون بحماية خصوصيتك وضمان أمن معلوماتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية بياناتك عند استخدام منصة خدمات الحيوانات الأليفة لدينا.",
      sections: {
        information: {
          title: "المعلومات التي نجمعها",
          content: [
            "المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف، والصورة الشخصية.",
            "معلومات الحيوانات الأليفة: تفاصيل عن حيواناتك الأليفة بما في ذلك الاسم، السلالة، العمر، والتاريخ الطبي.",
            "بيانات الموقع: موقعك الحالي لعرض خدمات الحيوانات الأليفة القريبة وأغراض التوصيل.",
            "معلومات الدفع: تفاصيل طريقة الدفع وسجل المعاملات.",
            "بيانات الاستخدام: كيفية تفاعلك مع تطبيقنا، بما في ذلك الخدمات المحجوزة والتفضيلات."
          ]
        },
        usage: {
          title: "كيف نستخدم معلوماتك",
          content: [
            "لتقديم وتحسين خدمات الحيوانات الأليفة",
            "لمعالجة حجوزاتك ومدفوعاتك",
            "للتواصل معك بشأن طلباتك وخدماتك",
            "لإرسال التحديثات والمحتوى الترويجي ذي الصلة",
            "لضمان سلامة وأمن منصتنا",
            "للامتثال للالتزامات القانونية"
          ]
        },
        sharing: {
          title: "مشاركة المعلومات",
          content: [
            "مع مقدمي الخدمات لتنفيذ طلباتك",
            "مع معالجي الدفع لإدارة المعاملات",
            "مع خدمات الطرف الثالث لوظائف التطبيق",
            "عند الطلب بموجب القانون أو لحماية حقوقنا"
          ]
        },
        security: {
          title: "أمن البيانات",
          content: [
            "نطبق إجراءات أمنية وفق معايير الصناعة",
            "بياناتك مشفرة أثناء النقل",
            "تقييمات وتحديثات أمنية منتظمة",
            "وصول محدود للمعلومات الشخصية من قبل الموظفين المصرح لهم"
          ]
        },
        rights: {
          title: "حقوقك",
          content: [
            "الوصول إلى معلوماتك الشخصية",
            "تصحيح البيانات غير الدقيقة",
            "طلب حذف بياناتك",
            "إلغاء الاشتراك في الاتصالات التسويقية",
            "التحكم في أذونات التطبيق (الموقع، الكاميرا، إلخ)"
          ]
        },
        children: {
          title: "خصوصية الأطفال",
          content: [
            "خدماتنا غير مخصصة للأطفال دون سن 13",
            "لا نجمع عن علم معلومات من الأطفال",
            "يمكن للوالدين طلب إزالة معلومات الأطفال"
          ]
        },
        updates: {
          title: "تحديثات سياسة الخصوصية",
          content: [
            "قد نقوم بتحديث هذه السياسة بشكل دوري",
            "سيتم إخطارك بالتغييرات المهمة",
            "استمرار استخدام التطبيق يعني قبول التغييرات"
          ]
        },
        contact: {
          title: "اتصل بنا",
          content: [
            "البريد الإلكتروني: privacy@petme.com",
            "الهاتف: ٧٨٩ ٤٥٦ ١٢٣ ٩٦٦+",
            "العنوان: الرياض، المملكة العربية السعودية"
          ]
        }
      }
    }
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
        // Set RTL
        const isRTL = savedLanguage === 'ar';
        if (isRTL !== I18nManager.isRTL) {
          I18nManager.allowRTL(isRTL);
          I18nManager.forceRTL(isRTL);
        }
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    try {
      await AsyncStorage.setItem('language', newLang);
      setLanguage(newLang);
      
      // Set RTL
      const isRTL = newLang === 'ar';
      if (isRTL !== I18nManager.isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
      }
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const value = {
    language,
    toggleLanguage,
    t: translations[language],
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 