import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import GimiCharacter from './GimiCharacter';

const GimiDialogue = ({
    text,
    mood = 'happy',
    onNext,
    showNextArrow = true,
    autoAdvance = false,
    delay = 0
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        let timeout;

        // Initial delay
        timeout = setTimeout(() => {
            startDialogue();
        }, delay);

        return () => clearTimeout(timeout);
    }, [text, delay]);

    const startDialogue = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Typewriter effect
        setIsTyping(true);
        setDisplayedText('');
        let currentIndex = 0;

        const typeInterval = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(prev => prev + text[currentIndex]);
                currentIndex++;
            } else {
                clearInterval(typeInterval);
                setIsTyping(false);

                if (autoAdvance && onNext) {
                    setTimeout(onNext, 1500);
                }
            }
        }, 30); // Speed of typing

        return () => clearInterval(typeInterval);
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.characterContainer}>
                <GimiCharacter mood={mood} size="small" />
            </View>

            <TouchableOpacity
                style={styles.bubble}
                activeOpacity={0.9}
                onPress={!isTyping && onNext ? onNext : undefined}
            >
                <Text style={styles.text}>{displayedText}</Text>

                {!isTyping && showNextArrow && (
                    <View style={styles.arrowContainer}>
                        <Text style={styles.arrow}>▼</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 15,
        marginBottom: 10,
    },
    characterContainer: {
        marginRight: 10,
        marginBottom: 5,
    },
    bubble: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderBottomLeftRadius: 5,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 80,
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    arrowContainer: {
        position: 'absolute',
        bottom: 10,
        right: 15,
    },
    arrow: {
        color: '#6366F1',
        fontSize: 12,
    },
});

export default GimiDialogue;
