import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL, getHeaders } from './constants/api';
import { useLanguage } from './context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message/lib/src/Toast';

// Mock data for products with categories
const INITIAL_PRODUCTS = [
  {
    id: '1',
    name: 'Royal Canin Food',
    price: 45,
    image: 'https://images.unsplash.com/photo-1582798358481-d199fb7347bb?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Premium pet food for all breeds',
    category: 'Food'
  },
  {
    id: '2',
    name: 'Pet Shampoo',
    image: 'https://images.unsplash.com/photo-1582798358481-d199fb7347bb?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 20,
    description: 'Gentle cleansing shampoo',
    category: 'Grooming'
  },
  {
    id: '3',
    name: 'Pet Brush',
    price: 15,
    image: 'https://images.unsplash.com/photo-1582798358481-d199fb7347bb?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Soft bristle brush for grooming',
    category: 'Grooming'
  }
];

export default function ProductsSettingsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image: '',
    description: '',
    category: '',
    stock: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [language]);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Toast.show({
          type: 'error',
          text1: language === 'ar' ? 'خطأ في المصادقة' : 'Authentication Error',
          text2: language === 'ar' ? 'الرجاء تسجيل الدخول مرة أخرى' : 'Please login again'
        });
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'GET',
        headers: {
          ...getHeaders(language),
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      
      if (data.success) {
        const allCategories = [
          { id: 'all', name: 'All', name_ar: 'الكل', icon: 'apps-outline' },
          ...data.categories
        ];
        setCategories(allCategories);
      } else {
        throw new Error(data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Toast.show({
        type: 'error',
        text1: language === 'ar' ? 'خطأ' : 'Error',
        text2: language === 'ar' ? 'فشل في تحميل الفئات' : 'Failed to load categories'
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchProducts = async (page = 1) => {
    if (!pagination.hasMore && page > 1) return;

    try {
      console.log('Starting to fetch products...');
      setIsLoadingProducts(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.replace('/login');
        return;
      }

      // Get provider ID from user data
      const userDataString = await AsyncStorage.getItem('user');
      console.log('User data from storage:', userDataString);
      
      if (!userDataString) {
        console.log('No user data found');
        Toast.show({
          type: 'error',
          text1: language === 'ar' ? 'خطأ في المصادقة' : 'Authentication Error',
          text2: language === 'ar' ? 'الرجاء تسجيل الدخول مرة أخرى' : 'Please login again'
        });
        router.replace('/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      console.log('Parsed user data:', userData);
      const providerId = userData.provider_id;

      if (!providerId) {
        console.log('No provider ID found in user data');
        Toast.show({
          type: 'error',
          text1: language === 'ar' ? 'خطأ' : 'Error',
          text2: language === 'ar' ? 'لم يتم العثور على معرف المزود' : 'Provider ID not found'
        });
        return;
      }

      console.log('Making API request with provider ID:', providerId);
      const response = await fetch(
        `${API_BASE_URL}/api/products?page=${page}&limit=10&provider_id=${providerId}`,
        {
          headers: {
            ...getHeaders(language),
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        console.log('API response not OK:', response.status, response.statusText);
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      setProducts(prevProducts => 
        page === 1 ? data.products : [...prevProducts, ...data.products]
      );
      
      setPagination({
        currentPage: data.pagination.current_page,
        totalPages: data.pagination.total_pages,
        hasMore: data.pagination.current_page < data.pagination.total_pages
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error details:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load products'
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingProducts && pagination.hasMore) {
      fetchProducts(pagination.currentPage + 1);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name_ar.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCategory = selectedCategory === 'all' || product.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setNewProduct(prev => ({ ...prev, image: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id || !selectedImage || !newProduct.stock) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' 
          ? 'يرجى ملء جميع الحقول المطلوبة واختيار صورة'
          : 'Please fill in all required fields and select an image'
      );
      return;
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert(
          language === 'ar' ? 'خطأ في المصادقة' : 'Authentication Error',
          language === 'ar' ? 'الرجاء تسجيل الدخول مرة أخرى' : 'Please login again'
        );
        router.replace('/login');
        return;
      }

      // Create FormData object
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('name_ar', newProduct.name_ar);
      formData.append('description', newProduct.description);
      formData.append('description_ar', newProduct.description_ar);
      formData.append('price', newProduct.price.toString());
      formData.append('category_id', newProduct.category_id.toString());
      formData.append('stock', newProduct.stock.toString());

      // Handle image upload
      const imageUri = selectedImage;
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: imageUri,
        name: `product-image.${fileType}`,
        type: `image/${fileType}`
      });

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Add the new product to the list
        setProducts(prevProducts => [data.product, ...prevProducts]);
        
        Alert.alert(
          language === 'ar' ? 'تم بنجاح' : 'Success',
          language === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully'
        );

        // Reset form and close modal
        setShowAddModal(false);
        setNewProduct({
          name: '',
          name_ar: '',
          price: '',
          image: '',
          description: '',
          description_ar: '',
          category_id: '',
          stock: '',
        });
        setSelectedImage(null);
      } else {
        throw new Error(data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Add product error:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' 
          ? 'فشل في إضافة المنتج' 
          : 'Failed to add product'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id || !newProduct.stock) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' 
          ? 'يرجى ملء جميع الحقول المطلوبة'
          : 'Please fill in all required fields'
      );
      return;
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert(
          language === 'ar' ? 'خطأ في المصادقة' : 'Authentication Error',
          language === 'ar' ? 'الرجاء تسجيل الدخول مرة أخرى' : 'Please login again'
        );
        router.replace('/login');
        return;
      }

      // Create FormData object
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('name_ar', newProduct.name_ar);
      formData.append('description', newProduct.description);
      formData.append('description_ar', newProduct.description_ar);
      formData.append('price', newProduct.price.toString());
      formData.append('category_id', newProduct.category_id.toString());
      formData.append('stock', newProduct.stock.toString());
      formData.append('is_active', 'true');

      // Only append image if a new one is selected
      if (selectedImage && selectedImage !== newProduct.image_url) {
        const imageUri = selectedImage;
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('image', {
          uri: imageUri,
          name: `product-image.${fileType}`,
          type: `image/${fileType}`
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Update the product in the list
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === selectedProduct.id ? data.product : p
          )
        );
        
        Alert.alert(
          language === 'ar' ? 'تم بنجاح' : 'Success',
          language === 'ar' ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully'
        );

        // Reset form and close modal
        setShowAddModal(false);
        setNewProduct({
          name: '',
          name_ar: '',
          price: '',
          image: '',
          description: '',
          description_ar: '',
          category_id: '',
          stock: '',
        });
        setSelectedImage(null);
        setIsEditing(false);
        setSelectedProduct(null);
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Update product error:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' 
          ? 'فشل في تحديث المنتج' 
          : 'Failed to update product'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setNewProduct({
      ...product,
      price: product.price.toString()
    });
    setSelectedImage(product.image_url);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Please login again'
        });
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.id}`, {
        method: 'DELETE',
        headers: {
          ...getHeaders(language),
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove the product from local state
        setProducts(products.filter(p => p.id !== selectedProduct.id));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product deleted successfully'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to delete product'
        });
      }
    } catch (error) {
      console.error('Delete product error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete product'
      });
    } finally {
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setNewProduct({ ...newProduct, category_id: categoryId });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2A363B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products Settings</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        {isLoadingCategories ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#86A8E7" />
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon || 'apps-outline'} 
                  size={20} 
                  color={selectedCategory === category.id ? '#fff' : '#666'} 
                  style={styles.categoryIcon}
                />
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive
                ]}>
                  {language === 'ar' ? category.name_ar : category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Product List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = (layoutMeasurement.height + contentOffset.y) 
            >= (contentSize.height - 20);
          
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {isLoadingProducts && products.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#86A8E7" />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
              {language === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
            </Text>
            <Text style={styles.emptyStateText}>
              {language === 'ar' 
                ? 'ابدأ بإضافة منتجات جديدة لعرضها هنا'
                : 'Start adding new products to display them here'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => {
                setIsEditing(false);
                setNewProduct({ name: '', price: '', image: '', description: '', category: '', stock: '' });
                setShowAddModal(true);
              }}
            >
              <Text style={styles.emptyStateButtonText}>
                {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {filteredProducts.map(product => (
              <View key={product.id} style={styles.productCard}>
                <Image 
                  source={{ uri: product.image_url }} 
                  style={styles.productImage}
                />
                <View style={styles.productContent}>
                  <View style={styles.productInfo}>
                    <View style={styles.productHeader}>
                      <View>
                        <Text style={styles.productName}>
                          {language === 'ar' ? product.name_ar : product.name}
                        </Text>
                        <Text style={styles.categoryTag}>
                          {product.category_id}
                        </Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEditProduct(product)}
                        >
                          <Ionicons name="create-outline" size={20} color="#86A8E7" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDeleteProduct(product)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.productPrice}>SAR {product.price}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
        
        {isLoadingProducts && products.length > 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#86A8E7" />
          </View>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          setIsEditing(false);
          setNewProduct({ name: '', price: '', image: '', description: '', category: '', stock: '' });
          setShowAddModal(true);
        }}
      >
        <LinearGradient
          colors={['#86A8E7', '#7F7FD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Product' : 'Add New Product'}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewProduct({ name: '', price: '', image: '', description: '', category: '', stock: '' });
                    setSelectedImage(null);
                    setIsEditing(false);
                    setSelectedProduct(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {/* Image Upload Section */}
                <TouchableOpacity 
                  style={styles.uploadButton} 
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  {(selectedImage) ? (
                    <>
                      <Image 
                        source={{ uri: selectedImage }} 
                        style={styles.uploadedImage}
                      />
                      <View style={styles.uploadOverlay}>
                        <Ionicons name="camera" size={24} color="#fff" />
                        <Text style={styles.uploadText}>Change Photo</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.uploadPlaceholder}>
                        <Ionicons name="cloud-upload-outline" size={32} color="#86A8E7" />
                        <Text style={styles.uploadText}>Upload Product Photo</Text>
                        <Text style={styles.uploadSubText}>Tap to choose a photo</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder={language === 'ar' ? 'اسم المنتج' : 'Product Name'}
                  value={newProduct.name}
                  onChangeText={text => setNewProduct({ ...newProduct, name: text })}
                  textAlign={language === 'ar' ? 'right' : 'left'}
                />

                <TextInput
                  style={styles.input}
                  placeholder={language === 'ar' ? 'اسم المنتج بالعربية' : 'Product Name in Arabic'}
                  value={newProduct.name_ar}
                  onChangeText={text => setNewProduct({ ...newProduct, name_ar: text })}
                  textAlign="right"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Price (SAR)"
                  value={newProduct.price.toString()}
                  keyboardType="numeric"
                  onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder={language === 'ar' ? 'المخزون' : 'Stock'}
                  value={newProduct.stock.toString()}
                  keyboardType="numeric"
                  onChangeText={text => setNewProduct({ ...newProduct, stock: text })}
                />

                <View style={styles.categorySelect}>
                  <Text style={styles.categoryLabel}>
                    {language === 'ar' ? 'اختر الفئة' : 'Select Category'}
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                  >
                    {categories.filter(cat => cat.id !== 'all').map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          newProduct.category_id === category.id && styles.categoryOptionActive
                        ]}
                        onPress={() => handleCategorySelect(category.id)}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          newProduct.category_id === category.id && styles.categoryOptionTextActive
                        ]}>
                          {language === 'ar' ? category.name_ar : category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={language === 'ar' ? 'وصف المنتج' : 'Description'}
                  value={newProduct.description}
                  onChangeText={text => setNewProduct({ ...newProduct, description: text })}
                  multiline
                  numberOfLines={3}
                  textAlign={language === 'ar' ? 'right' : 'left'}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={language === 'ar' ? 'وصف المنتج بالعربية' : 'Description in Arabic'}
                  value={newProduct.description_ar}
                  onChangeText={text => setNewProduct({ ...newProduct, description_ar: text })}
                  multiline
                  numberOfLines={3}
                  textAlign="right"
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
                onPress={isEditing ? handleUpdateProduct : handleAddProduct}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={['#86A8E7', '#7F7FD5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isEditing 
                        ? (language === 'ar' ? 'تحديث المنتج' : 'Update Product')
                        : (language === 'ar' ? 'إضافة منتج' : 'Add Product')
                      }
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.deleteModal]}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="warning-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.deleteTitle}>Delete Product</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete this product?
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={[styles.deleteButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setSelectedProduct(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, styles.confirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2A363B',
    marginLeft: 8,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  categoriesWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#86A8E7',
    borderColor: '#86A8E7',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 8,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 100,
  },
  productImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f8f9fa',
    resizeMode: 'cover',
  },
  productContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#86A8E7',
    fontWeight: '600',
    marginTop: -12,
  },
  productDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 6,
  },
  categoryTag: {
    fontSize: 12,
    color: '#86A8E7',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 100,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Platform.OS === 'ios' ? '85%' : '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  uploadButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    fontWeight: '500',
  },
  uploadSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categorySelect: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  categoryList: {
    paddingVertical: 4,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryOptionActive: {
    backgroundColor: '#86A8E7',
    borderColor: '#86A8E7',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666',
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  submitButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModal: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 24,
    marginHorizontal: 20,
    marginVertical: '40%',
  },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#86A8E7',
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
}); 