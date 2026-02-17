import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const CurrencyAnimation = ({ amount, visible, onComplete, startPosition = { x: 0, y: 0 } }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (visible) {
            animate();
        }
    }, [visible]);

    const animate = () => {
        translateY.setValue(0);
        opacity.setValue(0);
        scale.setValue(0.5);

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.spring(scale, {
                    toValue: 1.2,
                    friction: 3,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -100, // Float up
                    duration: 1000,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            Animated.sequence([
                Animated.delay(800),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            if (onComplete) onComplete();
        });
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { translateY },
                        { scale }
                    ],
                    opacity
                }
            ]}
        >
            <Text style={styles.text}>+{amount}</Text>
            <Text style={styles.icon}>💰</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '50%',
        left: '40%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
        zIndex: 1000,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#10B981',
        marginRight: 5,
    },
    icon: {
        fontSize: 24,
    },
});

export default CurrencyAnimation;
