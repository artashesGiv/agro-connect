import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Button, Text, type MD3Theme } from 'react-native-paper';

import { Screen } from '@/components/Screen';
import type { WelcomeScreenProps } from '@/navigation/types';
import { useAppTheme } from '@/theme';

import { FeatureBadge } from '../components/FeatureBadge';
import { OnboardingDots } from '../components/OnboardingDots';
import { ONBOARDING_SLIDES } from '../onboarding/slides';

const logo = require('../../../../assets/branding/logo.png');

const SLIDE_COUNT = ONBOARDING_SLIDES.length;
const LAST_INDEX = SLIDE_COUNT - 1;

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === LAST_INDEX;

  const scrollToIndex = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(LAST_INDEX, index)));
  };

  const goToLogin = () => navigation.navigate('Login');
  const goToRegister = () => navigation.navigate('Register');

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.sliderArea}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {ONBOARDING_SLIDES.map((slide, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });
            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [28, 0, 28],
              extrapolate: 'clamp',
            });

            return (
              <View key={slide.key} style={[styles.slide, { width }]}>
                <Animated.View style={[styles.slideInner, { opacity, transform: [{ translateY }] }]}>
                  {slide.variant === 'brand' ? (
                    <>
                      <Image
                        source={logo}
                        style={styles.logo}
                        resizeMode="contain"
                        accessibilityLabel="Земляк"
                      />
                      <Text style={styles.subtitle}>
                        Приложение для фермеров и агрономов: делитесь новостями со своих полей,
                        задавайте вопросы сообществу и следите за тем, что происходит у других
                        хозяйств рядом.
                      </Text>
                    </>
                  ) : null}

                  {slide.variant === 'feature' ? (
                    <>
                      <FeatureBadge icon={slide.icon} accent={slide.accent} theme={theme} />
                      <Text style={styles.title}>{slide.title}</Text>
                      <Text style={styles.subtitle}>{slide.description}</Text>
                    </>
                  ) : null}

                  {slide.variant === 'cta' ? (
                    <>
                      <Text style={styles.title}>Готовы начать?</Text>
                      <Text style={styles.subtitle}>
                        Войдите в свой аккаунт или создайте новый — это займёт меньше минуты.
                      </Text>
                    </>
                  ) : null}
                </Animated.View>
              </View>
            );
          })}
        </Animated.ScrollView>

        {!isLast ? (
          <Button
            mode="text"
            onPress={() => scrollToIndex(LAST_INDEX)}
            style={styles.skipButton}
            accessibilityLabel="Пропустить и перейти к входу или регистрации"
          >
            Пропустить
          </Button>
        ) : null}
      </View>

      <View style={styles.footer}>
        <OnboardingDots count={SLIDE_COUNT} scrollX={scrollX} width={width} theme={theme} />

        <View style={styles.footerActions}>
          {isLast ? (
            <>
              <Button
                mode="contained"
                onPress={goToLogin}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
                accessibilityLabel="Перейти к входу"
              >
                Войти
              </Button>
              <Button
                mode="outlined"
                onPress={goToRegister}
                style={styles.secondaryButton}
                contentStyle={styles.buttonContent}
                accessibilityLabel="Перейти к регистрации"
              >
                Создать аккаунт
              </Button>
            </>
          ) : (
            <Button
              mode="contained"
              icon="arrow-right"
              onPress={() => scrollToIndex(activeIndex + 1)}
              style={styles.primaryButton}
              contentStyle={[styles.buttonContent, styles.nextButtonContent]}
              accessibilityLabel="Далее"
            >
              Далее
            </Button>
          )}
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    screen: {
      justifyContent: 'space-between',
    },
    sliderArea: {
      flex: 1,
    },
    skipButton: {
      position: 'absolute',
      top: 4,
      right: 12,
      zIndex: 1,
    },
    slide: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    slideInner: {
      alignItems: 'center',
    },
    logo: {
      width: 180,
      height: 265,
      marginBottom: 4,
    },
    title: {
      color: theme.colors.onBackground,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 20,
    },
    footerActions: {
      gap: 12,
    },
    primaryButton: {
      borderRadius: 12,
    },
    secondaryButton: {
      borderRadius: 12,
      borderColor: theme.colors.primary,
    },
    buttonContent: {
      paddingVertical: 6,
    },
    nextButtonContent: {
      flexDirection: 'row-reverse',
    },
  });
