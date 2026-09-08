import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, type MD3Theme } from 'react-native-paper';

import { useAuth } from '../../../services/auth';
import { useAppTheme } from '../../../theme';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, signOut } = useAuth();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.info}>
        {user ? (
          <>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </>
        ) : (
          <Text style={styles.name}>Профиль</Text>
        )}
      </View>

      <Button
        mode="contained"
        buttonColor={theme.colors.errorContainer}
        textColor={theme.colors.onErrorContainer}
        onPress={signOut}
        style={styles.signOutButton}
        accessibilityLabel="Выйти из аккаунта"
      >
        Выйти
      </Button>
    </ScrollView>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    info: {
      marginBottom: 24,
    },
    name: {
      color: theme.colors.onBackground,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 8,
    },
    email: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
    },
    signOutButton: {
      marginTop: 'auto',
    },
  });
