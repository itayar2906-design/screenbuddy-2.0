import React from 'react';
import { View, Image, StyleSheet, Animated, Text } from 'react-native';
import PropTypes from 'prop-types';

const GimiCharacter = ({ mood, dialogue, position, style }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(100)).current;

    React.useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const getGimiImage = () => {
        // For now, use placeholder. Will be replaced with actual GIMI image
        return require('../../assets/gimi/gimi_base.png');
    };

    const containerStyle = position === 'fullscreen'
        ? styles.fullscreen
        : position === 'notification'
            ? styles.notification
            : styles.corner;

    return (
        <Animated.View
            style={[
                containerStyle,
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Image
                source={getGimiImage()}
                style={position === 'fullscreen' ? styles.imageLarge : styles.imageSmall}
                resizeMode="contain"
            />
            {dialogue && (
                <View style={styles.speechBubble}>
                    <TypewriterText text={dialogue} />
                </View>
            )}
        </Animated.View>
    );
};

// Simple typewriter effect component
const TypewriterText = ({ text }) => {
    const [displayText, setDisplayText] = React.useState('');
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 30);
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, text]);

    return (
        <Text style={styles.dialogueText}>{displayText}</Text>
    );
};

const styles = StyleSheet.create({
    fullscreen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 1000,
    },
    corner: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 80,
        height: 80,
        zIndex: 100,
    },
    notification: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
    },
    imageLarge: {
        width: 200,
        height: 200,
    },
    imageSmall: {
        width: 60,
        height: 60,
    },
    speechBubble: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginTop: 10,
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dialogueText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        fontWeight: '500',
    },
});

GimiCharacter.propTypes = {
    mood: PropTypes.oneOf(['happy', 'excited', 'thinking', 'wave', 'sad']).isRequired,
    dialogue: PropTypes.string,
    position: PropTypes.oneOf(['corner', 'fullscreen', 'notification']).isRequired,
    style: PropTypes.object,
};

export default GimiCharacter;
