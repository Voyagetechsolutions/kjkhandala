# 🔍 Debug: String to Double Cast Error

## 🎯 **Common Causes**

This error happens when a style property expects a number but receives a string.

## ✅ **Already Fixed:**
- ✅ Removed all `gap` properties
- ✅ All opacity values are numbers (0.9)
- ✅ All numeric style values are proper numbers

## 🔍 **Possible Remaining Issues:**

### **1. Data from Database**
The error might be from data coming from the database that's being used in styles or components.

Check these in your database:
```sql
-- Make sure these are numbers, not strings
SELECT price, available_seats, distance_km, duration_hours 
FROM trips 
LIMIT 5;
```

### **2. Icon Size Props**
Sometimes icon components receive string sizes. Check:
```typescript
// Wrong:
<Ionicons size="24" />

// Correct:
<Ionicons size={24} />
```

### **3. Temporary Fix: Wrap App in Error Boundary**

Add this to `App.tsx`:

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            {this.state.error?.toString()}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppNavigator />
    </ErrorBoundary>
  );
}
```

### **4. Check Specific Screens**

Test each screen individually by commenting out imports in `AppNavigator.tsx`:

```typescript
// Comment out screens one by one to find which causes the error
// import HomeScreen from '../screens/HomeScreen';
// import SearchScreen from '../screens/SearchScreen';
// etc...
```

### **5. Nuclear Option: Simplify HomeScreen**

Replace HomeScreen temporarily with a simple version:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Search', { 
          origin: 'Gaborone', 
          destination: 'Francistown', 
          date: '2025-11-21' 
        })}
      >
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
});
```

If this works, gradually add back features until you find the problematic line.

---

## 🚀 **Quick Test Steps:**

1. **Clear cache completely:**
   ```bash
   rm -rf node_modules
   rm -rf .expo
   rm -rf android/app/build
   npm install --legacy-peer-deps
   npx expo start --clear
   ```

2. **Test with simple HomeScreen** (see above)

3. **Check database data types**

4. **Add error boundary** to see exact error

---

## 💡 **Most Likely Cause:**

The error is probably from:
1. Database returning strings for numeric fields
2. A prop being passed as string instead of number
3. React Navigation params being incorrectly typed

Try the simple HomeScreen first to isolate the issue!
