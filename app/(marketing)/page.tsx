'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useSpring, MotionValue, AnimatePresence, useMotionValue, useVelocity } from 'framer-motion';
import { ArrowRight, Calendar, BarChart3, ListTodo, KanbanSquare, Users, Sparkles, FileText, Bot, Zap, Layers, Map, ClipboardList, Rocket, Search, Filter, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/magnetic';

type MarketingBoardTask = {
    id: string;
    title: string;
    priority?: 'High' | 'Normal' | 'Low';
    date?: string;
    tag?: string;
    assignee?: string;
};

type MarketingBoardColumn = {
    name: string;
    color: string;
    count: number;
    tasks: MarketingBoardTask[];
};

// --- Neurolinks Background Component ---
interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseX: number;
    baseY: number;
}

function NeurolinksBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nodesRef = useRef<Node[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const animationFrameRef = useRef<number>();
    
    const NODE_COUNT = 100;
    const CONNECTION_DISTANCE = 180;
    const MOUSE_ATTRACTION_DISTANCE = 250;
    const MOUSE_ATTRACTION_STRENGTH = 0.002;
    const RETURN_SPEED = 0.001;
    const BASE_VELOCITY = 0.2;

    const initNodes = useCallback((width: number, height: number) => {
        const nodes: Node[] = [];
        for (let i = 0; i < NODE_COUNT; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            nodes.push({
                x,
                y,
                vx: (Math.random() - 0.5) * BASE_VELOCITY,
                vy: (Math.random() - 0.5) * BASE_VELOCITY,
                radius: Math.random() * 1.5 + 1,
                baseX: x,
                baseY: y,
            });
        }
        return nodes;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            nodesRef.current = initNodes(canvas.width, canvas.height);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const nodes = nodesRef.current;
            const mouse = mouseRef.current;

            // Update and draw nodes
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                
                // Mouse attraction
                const dx = mouse.x - node.x;
                const dy = mouse.y - node.y;
                const distToMouse = Math.sqrt(dx * dx + dy * dy);
                
                if (distToMouse < MOUSE_ATTRACTION_DISTANCE && distToMouse > 0) {
                    const force = (MOUSE_ATTRACTION_DISTANCE - distToMouse) / MOUSE_ATTRACTION_DISTANCE;
                    node.vx += (dx / distToMouse) * force * MOUSE_ATTRACTION_STRENGTH;
                    node.vy += (dy / distToMouse) * force * MOUSE_ATTRACTION_STRENGTH;
                }
                
                // Add subtle constant drift
                const time = Date.now() * 0.0001;
                const driftX = Math.sin(time + i * 0.5) * 0.003;
                const driftY = Math.cos(time + i * 0.7) * 0.003;
                node.vx += driftX;
                node.vy += driftY;
                
                // Return to base position very slowly
                node.vx += (node.baseX - node.x) * RETURN_SPEED * 0.005;
                node.vy += (node.baseY - node.y) * RETURN_SPEED * 0.005;
                
                // Apply velocity with very strong damping for much slower movement
                node.vx *= 0.94;
                node.vy *= 0.94;
                node.x += node.vx;
                node.y += node.vy;
                
                // Keep within bounds
                if (node.x < 0 || node.x > canvas.width) {
                    node.vx *= -0.5;
                    node.x = Math.max(0, Math.min(canvas.width, node.x));
                }
                if (node.y < 0 || node.y > canvas.height) {
                    node.vy *= -0.5;
                    node.y = Math.max(0, Math.min(canvas.height, node.y));
                }
                
                // Draw node with glow effect based on mouse proximity
                const glowIntensity = distToMouse < MOUSE_ATTRACTION_DISTANCE 
                    ? (1 - distToMouse / MOUSE_ATTRACTION_DISTANCE) 
                    : 0;
                
                // Subtle outer glow (only when near cursor)
                if (glowIntensity > 0.1) {
                    const outerGlowRadius = node.radius + 8 + glowIntensity * 10;
                    const outerGradient = ctx.createRadialGradient(
                        node.x, node.y, 0,
                        node.x, node.y, outerGlowRadius
                    );
                    outerGradient.addColorStop(0, `rgba(99, 102, 241, ${glowIntensity * 0.4})`);
                    outerGradient.addColorStop(0.6, `rgba(139, 92, 246, ${glowIntensity * 0.2})`);
                    outerGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, outerGlowRadius, 0, Math.PI * 2);
                    ctx.fillStyle = outerGradient;
                    ctx.fill();
                }
                
                // Main node
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + glowIntensity * 2, 0, Math.PI * 2);
                const nodeAlpha = 0.5 + glowIntensity * 0.4;
                ctx.fillStyle = `rgba(147, 197, 253, ${nodeAlpha})`;
                ctx.fill();
                
                // Inner bright core (smaller)
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + glowIntensity * 0.4})`; 
                ctx.fill();
            }

            // Draw connections between nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < CONNECTION_DISTANCE) {
                        // Check if connection is near mouse for highlight
                        const midX = (nodes[i].x + nodes[j].x) / 2;
                        const midY = (nodes[i].y + nodes[j].y) / 2;
                        const distToMouseFromLine = Math.sqrt(
                            Math.pow(mouse.x - midX, 2) + Math.pow(mouse.y - midY, 2)
                        );
                        
                        const baseAlpha = (1 - distance / CONNECTION_DISTANCE) * 0.25;
                        const mouseBoost = distToMouseFromLine < MOUSE_ATTRACTION_DISTANCE 
                            ? (1 - distToMouseFromLine / MOUSE_ATTRACTION_DISTANCE) * 0.5 
                            : 0;
                        const alpha = baseAlpha + mouseBoost;
                        
                        // Line width - thinner lines
                        ctx.lineWidth = mouseBoost > 0.1 ? 1 + mouseBoost : 0.8;
                        
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        
                        // Subtle gradient for lines
                        if (mouseBoost > 0.1) {
                            const gradient = ctx.createLinearGradient(
                                nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y
                            );
                            gradient.addColorStop(0, `rgba(147, 197, 253, ${alpha})`);
                            gradient.addColorStop(0.5, `rgba(167, 139, 250, ${alpha})`);
                            gradient.addColorStop(1, `rgba(147, 197, 253, ${alpha})`);
                            ctx.strokeStyle = gradient;
                        } else {
                            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
                        }
                        ctx.stroke();
                    }
                }
            }
            
            // Draw connections to mouse cursor
            if (mouse.x > 0 && mouse.y > 0) {
                for (let i = 0; i < nodes.length; i++) {
                    const dx = mouse.x - nodes[i].x;
                    const dy = mouse.y - nodes[i].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < MOUSE_ATTRACTION_DISTANCE) {
                        const alpha = (1 - distance / MOUSE_ATTRACTION_DISTANCE) * 0.5;
                        
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        
                        const gradient = ctx.createLinearGradient(
                            nodes[i].x, nodes[i].y, mouse.x, mouse.y
                        );
                        gradient.addColorStop(0, `rgba(147, 197, 253, ${alpha})`);
                        gradient.addColorStop(0.5, `rgba(167, 139, 250, ${alpha * 0.8})`);
                        gradient.addColorStop(1, `rgba(192, 132, 252, ${alpha * 0.6})`);
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 0.8 + alpha;
                        ctx.stroke();
                    }
                }
                
                // Subtle cursor glow
                const cursorGradient = ctx.createRadialGradient(
                    mouse.x, mouse.y, 0,
                    mouse.x, mouse.y, 60
                );
                cursorGradient.addColorStop(0, 'rgba(167, 139, 250, 0.25)');
                cursorGradient.addColorStop(0.4, 'rgba(99, 102, 241, 0.1)');
                cursorGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
                ctx.fillStyle = cursorGradient;
                ctx.fill();
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [initNodes]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ opacity: 1, zIndex: 1 }}
        />
    );
}

// --- Reusable Components ---
function MaskedText({ children, className = '', delay = 0, useAnimate = false }: { children: React.ReactNode, className?: string, delay?: number, useAnimate?: boolean }) {
    if (useAnimate) {
        return (
            <div className="overflow-hidden">
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay }}
                    className={className}
                >
                    {children}
                </motion.div>
            </div>
        );
    }
    
    return (
        <div className="overflow-hidden">
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay }}
                className={className}
            >
                {children}
            </motion.div>
        </div>
    );
}

function ParallaxText({ children, baseVelocity = 100 }: { children: string, baseVelocity?: number }) {
    const baseX = useMotionValue(0);
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400
    });
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
        clamp: false
    });

    useEffect(() => {
        const unsubscribe = velocityFactor.on('change', (latest) => {
            const x = baseX.get() + latest * 0.5;
            baseX.set(x);
        });
        return () => unsubscribe();
    }, [velocityFactor, baseX]);

    const x = useTransform(baseX, (v) => `${v}%`);

    return (
        <div className="overflow-hidden whitespace-nowrap flex flex-nowrap">
            <motion.div className="font-bold text-9xl tracking-tighter uppercase opacity-10" style={{ x }}>
                <span className="block mr-10">{children} </span>
                <span className="block mr-10">{children} </span>
                <span className="block mr-10">{children} </span>
                <span className="block mr-10">{children} </span>
            </motion.div>
        </div>
    );
}

// Particle System Component
type Particle = {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    drift: number;
};

function ParticleSystem() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate particles only on the client to avoid hydration mismatches.
        const generatedParticles = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 20 + 10,
            delay: Math.random() * 5,
            drift: Math.random() * 20 - 10,
        }));
        setParticles(generatedParticles);
    }, []);

    if (!particles.length) {
        return null;
    }

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-blue-500/20"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, particle.drift, 0],
                        opacity: [0.2, 0.8, 0.2],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = '', duration = 2 }: { value: number, suffix?: string, duration?: number }) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);

    useEffect(() => {
        const startTime = Date.now();
        const endValue = value;
        const startValue = 0;

        const updateCount = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (endValue - startValue) * easeOut);
            
            setCount(current);
            countRef.current = current;

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                setCount(endValue);
            }
        };

        requestAnimationFrame(updateCount);
    }, [value, duration]);

    return <span>{count}{suffix}</span>;
}

// Floating Orb Component
function FloatingOrb({ delay = 0, size = 200, color = 'blue' }: { delay?: number, size?: number, color?: string }) {
    const colors = {
        blue: 'bg-blue-500/10',
        purple: 'bg-purple-500/10',
        green: 'bg-green-500/10'
    };

    return (
        <motion.div
            className={`absolute rounded-full ${colors[color as keyof typeof colors] || colors.blue} blur-3xl`}
            style={{
                width: size,
                height: size,
            }}
            animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                scale: [1, 1.2, 1],
            }}
            transition={{
                duration: 20,
                repeat: Infinity,
                delay,
                ease: "easeInOut"
            }}
        />
    );
}

// --- Visual Components ---

// 1. AI Sprint Workflow Animation
function HeroVisual() {
    // Phases: backlog -> planning -> board -> results
    const [phase, setPhase] = useState<'backlog' | 'planning' | 'board' | 'results'>('backlog');
    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
    const [boardColumns, setBoardColumns] = useState({ todo: [] as any[], inProgress: [] as any[], done: [] as any[] });
    const [aiMessage, setAiMessage] = useState("📋 Reviewing product backlog...");
    const [resultsAnimated, setResultsAnimated] = useState(false);

    const allTasks = [
        { id: 1, title: "User Authentication", priority: "high", estimate: 5, selected: false },
        { id: 2, title: "Dashboard Charts", priority: "medium", estimate: 3, selected: false },
        { id: 3, title: "API Endpoints", priority: "high", estimate: 8, selected: false },
        { id: 4, title: "Email Notifications", priority: "low", estimate: 2, selected: false },
        { id: 5, title: "Search Feature", priority: "medium", estimate: 5, selected: false },
        { id: 6, title: "User Settings", priority: "low", estimate: 3, selected: false },
    ];

    const priorityColors = {
        high: "bg-red-500",
        medium: "bg-yellow-500",
        low: "bg-green-500"
    };

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        
        if (phase === 'backlog') {
            // Show backlog for 3 seconds, then move to planning
            timeout = setTimeout(() => {
                setAiMessage("🎯 Starting sprint planning...");
                setPhase('planning');
            }, 3000);
        } else if (phase === 'planning') {
            // Animate task selection one by one
            const tasksToSelect = [1, 2, 3, 4]; // Select first 4 tasks
            let i = 0;
            const selectInterval = setInterval(() => {
                if (i < tasksToSelect.length) {
                    setSelectedTasks(prev => [...prev, tasksToSelect[i]]);
                    setAiMessage(i === 0 ? "🔍 Analyzing priorities..." : 
                                 i === 1 ? "⚡ Adding high-value tasks..." :
                                 i === 2 ? "📊 Balancing workload..." :
                                 "✅ Sprint capacity: 18 pts");
                    i++;
                } else {
                    clearInterval(selectInterval);
                    setTimeout(() => {
                        setAiMessage("🚀 Starting sprint execution...");
                        setBoardColumns({
                            todo: allTasks.filter(t => tasksToSelect.includes(t.id)),
                            inProgress: [],
                            done: []
                        });
                        setPhase('board');
                    }, 1500);
                }
            }, 1000);
            return () => clearInterval(selectInterval);
        } else if (phase === 'board') {
            // Animate tasks moving through the board
            const movements = [
                { from: 'todo', to: 'inProgress', taskId: 1, message: "🔄 Starting authentication work..." },
                { from: 'todo', to: 'inProgress', taskId: 2, message: "📈 Parallel development active..." },
                { from: 'inProgress', to: 'done', taskId: 1, message: "✅ Authentication complete!" },
                { from: 'todo', to: 'inProgress', taskId: 3, message: "🔌 Building API layer..." },
                { from: 'inProgress', to: 'done', taskId: 2, message: "✅ Dashboard shipped!" },
                { from: 'todo', to: 'inProgress', taskId: 4, message: "📧 Setting up notifications..." },
                { from: 'inProgress', to: 'done', taskId: 3, message: "✅ API endpoints ready!" },
                { from: 'inProgress', to: 'done', taskId: 4, message: "🎉 Sprint complete!" },
            ];
            
            let i = 0;
            const moveInterval = setInterval(() => {
                if (i < movements.length) {
                    const move = movements[i];
                    setAiMessage(move.message);
                    setBoardColumns(prev => {
                        const task = prev[move.from as keyof typeof prev].find(t => t.id === move.taskId);
                        if (!task) return prev;
                        return {
                            ...prev,
                            [move.from]: prev[move.from as keyof typeof prev].filter(t => t.id !== move.taskId),
                            [move.to]: [...prev[move.to as keyof typeof prev], task]
                        };
                    });
                    i++;
                } else {
                    clearInterval(moveInterval);
                    setTimeout(() => {
                        setAiMessage("📊 Generating sprint report...");
                        setPhase('results');
                        setResultsAnimated(true);
                    }, 1500);
                }
            }, 1200);
            return () => clearInterval(moveInterval);
        } else if (phase === 'results') {
            // Show results for 5 seconds, then restart
            timeout = setTimeout(() => {
                setPhase('backlog');
                setSelectedTasks([]);
                setBoardColumns({ todo: [], inProgress: [], done: [] });
                setResultsAnimated(false);
                setAiMessage("📋 Reviewing product backlog...");
            }, 6000);
        }
        
        return () => clearTimeout(timeout);
    }, [phase]);

    // Phase indicators
    const phases = [
        { key: 'backlog', label: 'Backlog', icon: ListTodo },
        { key: 'planning', label: 'Planning', icon: Users },
        { key: 'board', label: 'Execution', icon: KanbanSquare },
        { key: 'results', label: 'Results', icon: BarChart3 },
    ];

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <motion.div 
                className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
            />

                <motion.div 
                className="w-full h-full bg-[#0A0A0A]/95 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header with Phase Indicator */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                    <motion.div 
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <Bot className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                                <div className="text-base font-bold text-white">AI Sprint Manager</div>
                                <div className="text-xs text-gray-500">Autonomous Workflow</div>
                    </div>
                        </div>
                        <motion.div 
                            className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span className="flex items-center gap-2">
                                <motion.div 
                                    className="w-2 h-2 rounded-full bg-blue-400"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                AI Active
                            </span>
                </motion.div>
                    </div>
                    
                    {/* Phase Progress Bar */}
                    <div className="flex items-center gap-2">
                        {phases.map((p, i) => (
                            <div key={p.key} className="flex items-center flex-1">
                                <motion.div 
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-1 transition-all ${
                                        phase === p.key ? 'bg-blue-500/20 text-blue-400' : 
                                        phases.findIndex(x => x.key === phase) > i ? 'bg-green-500/20 text-green-400' :
                                        'bg-white/5 text-gray-500'
                                    }`}
                                    animate={phase === p.key ? { scale: [1, 1.02, 1] } : {}}
                                    transition={{ duration: 1, repeat: phase === p.key ? Infinity : 0 }}
                                >
                                    <p.icon className="w-4 h-4" />
                                    <span className="text-xs font-medium">{p.label}</span>
            </motion.div>
                                {i < phases.length - 1 && (
                                    <div className={`w-4 h-0.5 ${phases.findIndex(x => x.key === phase) > i ? 'bg-green-500' : 'bg-white/10'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Message */}
                <AnimatePresence mode="wait">
            <motion.div 
                        key={aiMessage}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="px-5 py-3 bg-blue-500/10 text-blue-400 text-sm flex items-center gap-2"
                    >
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                            <Bot className="w-4 h-4" />
                        </motion.div>
                        <span className="font-medium">{aiMessage}</span>
                    </motion.div>
                </AnimatePresence>

                {/* Main Content Area */}
                <div className="flex-1 p-5 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {/* BACKLOG PHASE */}
                        {phase === 'backlog' && (
                <motion.div 
                                key="backlog"
                                initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <ListTodo className="w-5 h-5 text-gray-400" />
                                    <span className="text-base font-semibold text-white">Product Backlog</span>
                                    <span className="text-sm text-gray-500 ml-auto">26 total points</span>
                                </div>
                                <div className="space-y-3">
                                    {allTasks.map((task, i) => (
                    <motion.div 
                                            key={task.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4"
                                        >
                                            <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-white">{task.title}</div>
                                                <div className="text-xs text-gray-500">{task.priority} priority</div>
                                            </div>
                                            <div className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400">{task.estimate} pts</div>
                    </motion.div>
                                    ))}
                                </div>
                </motion.div>
                        )}

                        {/* PLANNING PHASE */}
                        {phase === 'planning' && (
                            <motion.div
                                key="planning"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    <span className="text-base font-semibold text-white">Sprint Planning</span>
                                    <span className="text-sm text-blue-400 ml-auto">
                                        {selectedTasks.reduce((acc, id) => acc + (allTasks.find(t => t.id === id)?.estimate || 0), 0)} / 20 pts
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-2">Available Tasks</div>
                <div className="space-y-2">
                                            {allTasks.filter(t => !selectedTasks.includes(t.id)).map((task) => (
                        <motion.div
                                                    key={task.id}
                                                    layout
                                                    className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3"
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
                                                    <span className="text-sm text-gray-400 flex-1">{task.title}</span>
                                                    <span className="text-xs text-gray-500">{task.estimate}p</span>
                                                </motion.div>
                    ))}
                </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-blue-400 mb-2">Sprint Backlog</div>
                                        <div className="space-y-2 min-h-[200px] p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                                            <AnimatePresence>
                                                {selectedTasks.map((id) => {
                                                    const task = allTasks.find(t => t.id === id);
                                                    if (!task) return null;
                                                    return (
                                                        <motion.div
                                                            key={task.id}
                                                            initial={{ opacity: 0, scale: 0.8, x: -50 }}
                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                            className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 flex items-center gap-3"
                                                        >
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                                                            >
                                                                <Sparkles className="w-3 h-3 text-white" />
            </motion.div>
                                                            <span className="text-sm text-white flex-1">{task.title}</span>
                                                            <span className="text-xs text-blue-400">{task.estimate}p</span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* BOARD PHASE */}
                        {phase === 'board' && (
             <motion.div 
                                key="board"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full"
                            >
                                <div className="grid grid-cols-3 gap-4 h-full">
                                    {[
                                        { key: 'todo', title: 'To Do', icon: ListTodo, color: 'gray' },
                                        { key: 'inProgress', title: 'In Progress', icon: Zap, color: 'blue' },
                                        { key: 'done', title: 'Done', icon: Sparkles, color: 'green' },
                                    ].map((col) => (
                                        <div key={col.key} className={`rounded-xl p-3 bg-${col.color}-500/5`}>
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                                <col.icon className={`w-4 h-4 text-${col.color}-400`} />
                                                <span className="text-sm font-medium text-gray-300">{col.title}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ml-auto bg-${col.color}-500/20 text-${col.color}-400`}>
                                                    {boardColumns[col.key as keyof typeof boardColumns].length}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <AnimatePresence mode="popLayout">
                                                    {boardColumns[col.key as keyof typeof boardColumns].map((task) => (
                    <motion.div
                                                            key={task.id}
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8, x: 30 }}
                                                            className={`p-3 rounded-lg border ${
                                                                col.key === 'done' ? 'bg-green-500/10 border-green-500/30' :
                                                                col.key === 'inProgress' ? 'bg-blue-500/10 border-blue-500/30' :
                                                                'bg-white/5 border-white/10'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
                                                                <span className={`text-sm ${col.key === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                                    {task.title}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1 ml-4">{task.estimate} pts</div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* RESULTS PHASE */}
                        {phase === 'results' && (
                    <motion.div
                                key="results"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="h-full flex flex-col items-center justify-center"
                            >
                    <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="text-center mb-6"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-green-400" />
                </div>
                                    <div className="text-2xl font-bold text-white mb-1">Sprint Complete! 🎉</div>
                                    <div className="text-sm text-gray-400">All tasks delivered successfully</div>
                                </motion.div>
                                
                                <div className="grid grid-cols-3 gap-6 w-full max-w-md">
                                    {[
                                        { label: "Tasks Done", value: "4/4", color: "green" },
                                        { label: "Points", value: "18", color: "blue" },
                                        { label: "On Time", value: "100%", color: "purple" },
                                    ].map((stat, i) => (
                         <motion.div 
                                            key={stat.label}
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.2 }}
                                            className={`text-center p-4 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}
                         >
                             <motion.div 
                                                className={`text-3xl font-bold text-${stat.color}-400`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: i * 0.2 + 0.3, type: "spring" }}
                                            >
                                                {stat.value}
                             </motion.div>
                                            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                             <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-6 flex items-center gap-2 text-sm text-yellow-400"
                                >
                                    <Zap className="w-4 h-4" />
                                    <span>Velocity: +15% vs last sprint</span>
                             </motion.div>
                         </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between text-sm text-gray-500">
                    <span>Sprint 24 • 2 weeks</span>
                    <span className="flex items-center gap-1">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                            <Zap className="w-4 h-4 text-yellow-500" />
                        </motion.div>
                        Powered by AI
                    </span>
                </div>
             </motion.div>
        </div>
    );
}

function FeatureSequence() {
    const [activeTab, setActiveTab] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    
    const tabs = [
        { id: 'backlog', label: 'Backlog', icon: ClipboardList, clickable: true },
        { id: 'board', label: 'Board', icon: KanbanSquare, clickable: true },
        { id: 'tasks', label: 'Tasks', icon: ListTodo, clickable: true },
        { id: 'calendar', label: 'Calendar', icon: Calendar, clickable: true },
        { id: 'roadmap', label: 'Roadmap', icon: Map, clickable: true },
        { id: 'releases', label: 'Releases', icon: Rocket, clickable: true },
        { id: 'sprints', label: 'Sprints', icon: Zap, clickable: true },
        { id: 'docs', label: 'Docs', icon: FileText, clickable: true },
        { id: 'more', label: 'More', icon: MoreVertical, clickable: false },
    ];

    // Get only clickable tabs for auto-cycling
    const clickableTabs = tabs.filter(tab => tab.clickable);
    const clickableTabIndices = tabs.map((tab, index) => tab.clickable ? index : -1).filter(i => i !== -1);
    
    // Auto-cycle tabs every 5 seconds (pauses when user clicks a tab)
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setActiveTab(prev => {
                const currentClickableIndex = clickableTabIndices.indexOf(prev);
                const nextClickableIndex = (currentClickableIndex + 1) % clickableTabIndices.length;
                return clickableTabIndices[nextClickableIndex];
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [isPaused, clickableTabIndices]);
    
    const handleTabClick = (index: number) => {
        // Only allow clicking on clickable tabs
        if (tabs[index].clickable) {
            setActiveTab(index);
            setIsPaused(true);
        }
    };

    // Sample data for the views
    const boardColumns: MarketingBoardColumn[] = [
        { 
            name: 'New', 
            color: 'bg-emerald-500', 
            count: 2,
            tasks: [
                { id: 'TIT-8', title: 'Design system update', priority: 'High', date: '28/11/2025' },
                { id: 'TIT-3', title: 'API documentation', tag: 'Backend', date: '10/11/2025' },
            ]
        },
        { 
            name: 'Backlog', 
            color: 'bg-amber-500', 
            count: 3,
            tasks: [
                { id: 'TIT-9', title: 'User onboarding flow', priority: 'Normal' },
                { id: 'TIT-7', title: 'Performance optimization', priority: 'Normal' },
                { id: 'TIT-2', title: 'Mobile responsiveness', priority: 'Low' },
            ]
        },
        { 
            name: 'To Do', 
            color: 'bg-blue-500', 
            count: 2,
            tasks: [
                { id: 'TIT-6', title: 'Authentication module', priority: 'Normal' },
                { id: 'TIT-5', title: 'Dashboard analytics', priority: 'Normal' },
            ]
        },
        { 
            name: 'In Progress', 
            color: 'bg-purple-500', 
            count: 1,
            tasks: [
                { id: 'TIT-4', title: 'Sprint planning AI', priority: 'High', assignee: 'JD' },
            ]
        },
    ];

    const tasksList = [
        { id: 'TIT-8', title: 'Design system update', status: 'New', priority: 'High', assignee: 'Sarah', date: '28/11' },
        { id: 'TIT-4', title: 'Sprint planning AI', status: 'In Progress', priority: 'High', assignee: 'John', date: '25/11' },
        { id: 'TIT-6', title: 'Authentication module', status: 'To Do', priority: 'Normal', assignee: 'Mike', date: '30/11' },
        { id: 'TIT-9', title: 'User onboarding flow', status: 'Backlog', priority: 'Normal', assignee: '-', date: '-' },
        { id: 'TIT-7', title: 'Performance optimization', status: 'Backlog', priority: 'Normal', assignee: '-', date: '-' },
    ];

    const calendarEvents = [
        { day: 'Mon', events: [{ title: 'Sprint Review', time: '10:00', color: 'bg-blue-500' }] },
        { day: 'Tue', events: [{ title: 'Design Sync', time: '14:00', color: 'bg-purple-500' }, { title: 'Team Standup', time: '09:00', color: 'bg-emerald-500' }] },
        { day: 'Wed', events: [{ title: 'Planning', time: '11:00', color: 'bg-amber-500' }] },
        { day: 'Thu', events: [{ title: 'Demo Day', time: '15:00', color: 'bg-red-500' }] },
        { day: 'Fri', events: [{ title: 'Retrospective', time: '16:00', color: 'bg-blue-500' }] },
    ];

    const sprintData = {
        name: 'Sprint 24',
        progress: 68,
        velocity: 42,
        daysLeft: 5,
        tasks: { done: 8, inProgress: 3, todo: 4 }
    };

    const docs = [
        { title: 'Product Requirements', icon: '📋', updated: '2 hours ago', author: 'Sarah' },
        { title: 'API Documentation', icon: '🔌', updated: '1 day ago', author: 'John' },
        { title: 'Design Guidelines', icon: '🎨', updated: '3 days ago', author: 'Mike' },
        { title: 'Sprint Notes', icon: '📝', updated: 'Just now', author: 'AI' },
    ];

    const roadmapTasks = [
        { id: 'RMD-14', title: 'User Authentication', status: 'backlog', color: 'bg-blue-500', startMonth: 1, duration: 2 },
        { id: 'TTF-2', title: 'Dashboard Analytics', status: 'backlog', color: 'bg-purple-500', startMonth: 1, duration: 3 },
        { id: 'TTF-1', title: 'API Integration', status: 'backlog', color: 'bg-emerald-500', startMonth: 2, duration: 4 },
        { id: 'TTF-4', title: 'Mobile App MVP', status: 'backlog', color: 'bg-amber-500', startMonth: 2, duration: 2 },
        { id: 'TTF-5', title: 'Payment System', status: 'backlog', color: 'bg-red-500', startMonth: 3, duration: 2 },
        { id: 'TTF-6', title: 'Notifications', status: 'backlog', color: 'bg-pink-500', startMonth: 3, duration: 2 },
        { id: 'TTF-7', title: 'Reports Module', status: 'backlog', color: 'bg-cyan-500', startMonth: 4, duration: 2 },
    ];

    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

    const renderContent = () => {
        switch (tabs[activeTab].id) {
            case 'backlog':
                const backlogItems = [
                    { id: 'BL-1', title: 'User Authentication System', priority: 'high', points: 8, type: 'feature', votes: 12 },
                    { id: 'BL-2', title: 'Dashboard Analytics Module', priority: 'high', points: 5, type: 'feature', votes: 8 },
                    { id: 'BL-3', title: 'API Rate Limiting', priority: 'medium', points: 3, type: 'technical', votes: 5 },
                    { id: 'BL-4', title: 'Email Notification Service', priority: 'medium', points: 5, type: 'feature', votes: 7 },
                    { id: 'BL-5', title: 'Mobile Responsive Design', priority: 'low', points: 8, type: 'improvement', votes: 4 },
                    { id: 'BL-6', title: 'Search Functionality', priority: 'high', points: 5, type: 'feature', votes: 15 },
                    { id: 'BL-7', title: 'Performance Optimization', priority: 'medium', points: 3, type: 'technical', votes: 3 },
                    { id: 'BL-8', title: 'User Settings Page', priority: 'low', points: 3, type: 'feature', votes: 2 },
                ];
                const priorityColors: Record<string, string> = {
                    high: 'bg-red-500/20 text-red-400 border-red-500/30',
                    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                };
                const typeColors: Record<string, string> = {
                    feature: 'bg-blue-500/20 text-blue-400',
                    technical: 'bg-purple-500/20 text-purple-400',
                    improvement: 'bg-emerald-500/20 text-emerald-400',
                };
                return (
                    <div className="p-6 h-full flex flex-col">
                        {/* Backlog Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-baseline gap-3">
                                <h3 className="text-lg font-semibold text-white leading-none">Product Backlog</h3>
                                <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full">{backlogItems.length} items</span>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{backlogItems.reduce((acc, item) => acc + item.points, 0)} pts total</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Sort by:</span>
                                <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">Priority</span>
                            </div>
                        </div>
                        
                        {/* Backlog List */}
                        <div className="bg-[#1a1a2e] rounded-lg border border-white/10 overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/10 text-xs text-gray-500 font-medium">
                                <div className="col-span-1">ID</div>
                                <div className="col-span-5">Title</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-2">Priority</div>
                                <div className="col-span-1">Points</div>
                                <div className="col-span-1">Votes</div>
                            </div>
                            
                            {/* Items */}
                            {backlogItems.map((item, i) => (
                        <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="grid grid-cols-12 gap-2 p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors items-center"
                                >
                                    <div className="col-span-1 text-xs text-amber-500 font-mono">{item.id}</div>
                                    <div className="col-span-5 text-sm text-white">{item.title}</div>
                                    <div className="col-span-2">
                                        <span className={`text-xs px-2 py-0.5 rounded ${typeColors[item.type]}`}>
                                            {item.type}
                                        </span>
                            </div>
                                    <div className="col-span-2">
                                        <span className={`text-xs px-2 py-0.5 rounded border ${priorityColors[item.priority]}`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-sm text-gray-400">{item.points}</div>
                                    <div className="col-span-1 flex items-center gap-1 text-sm text-gray-400">
                                        <span>👍</span> {item.votes}
                                    </div>
                        </motion.div>
                    ))}
                </div>
                        
                        {/* AI Suggestion */}
                                <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20 flex items-start gap-3"
                        >
                            <span className="text-lg">🤖</span>
                            <div>
                                <div className="text-sm text-white font-medium mb-1">AI Recommendation</div>
                                <div className="text-xs text-gray-400">Based on team velocity and priorities, recommend moving <span className="text-blue-400">BL-6 Search Functionality</span> and <span className="text-blue-400">BL-1 User Authentication</span> to the next sprint.</div>
                            </div>
                        </motion.div>
                    </div>
                );
            case 'board':
                return (
                    <div className="flex gap-4 p-6 overflow-x-auto h-full">
                        {boardColumns.map((col, i) => (
                        <motion.div
                                key={col.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="min-w-[240px] flex-1 flex flex-col"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                                    <span className="text-sm font-medium text-white">{col.name}</span>
                                    <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">{col.count}</span>
                            </div>
                                <div className="space-y-2 flex-1 bg-white/5 rounded-lg p-3">
                                    {col.tasks.map((task, j) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 + j * 0.05 }}
                                            className="p-3 bg-[#1a1a2e] rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                                        >
                                            <div className="text-xs text-amber-500 mb-1">{task.id}</div>
                                            <div className="text-sm text-white mb-2">{task.title}</div>
                                            <div className="flex items-center gap-2">
                                                {task.priority && (
                                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                                        task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                                        task.priority === 'Low' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                    }`}>{task.priority}</span>
                                                )}
                                                {task.tag && <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{task.tag}</span>}
                                                {task.date && <span className="text-xs text-gray-500 ml-auto">📅 {task.date}</span>}
                                                {task.assignee && (
                                                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white ml-auto">
                                                        {task.assignee}
                                                    </div>
                                                )}
                                            </div>
                        </motion.div>
                            ))}
                        </div>
                            </motion.div>
                        ))}
                        </div>
                );
            case 'tasks':
                return (
                    <div className="p-6 h-full">
                        <div className="bg-[#1a1a2e] rounded-lg border border-white/10 overflow-hidden h-full">
                            <div className="grid grid-cols-6 gap-4 p-3 border-b border-white/10 text-xs text-gray-500 font-medium">
                                <span>ID</span>
                                <span className="col-span-2">Task</span>
                                <span>Status</span>
                                <span>Assignee</span>
                                <span>Due</span>
                    </div>
                            {tasksList.map((task, i) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="grid grid-cols-6 gap-4 p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <span className="text-xs text-amber-500">{task.id}</span>
                                    <span className="text-sm text-white col-span-2">{task.title}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded w-fit ${
                                        task.status === 'In Progress' ? 'bg-purple-500/20 text-purple-400' :
                                        task.status === 'To Do' ? 'bg-blue-500/20 text-blue-400' :
                                        task.status === 'New' ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-amber-500/20 text-amber-400'
                                    }`}>{task.status}</span>
                                    <span className="text-sm text-gray-400">{task.assignee}</span>
                                    <span className="text-sm text-gray-500">{task.date}</span>
                                </motion.div>
                            ))}
                </div>
                         </div>
                );
            case 'calendar':
                const monthDays = Array.from({ length: 30 }, (_, i) => i + 1);
                const monthEvents: { [key: number]: { title: string; time: string; color: string }[] } = {
                    3: [{ title: 'Sprint Review', time: '10:00', color: 'bg-blue-500' }],
                    7: [{ title: 'Design Sync', time: '14:00', color: 'bg-purple-500' }],
                    12: [{ title: 'Team Standup', time: '09:00', color: 'bg-emerald-500' }, { title: 'Planning', time: '14:00', color: 'bg-amber-500' }],
                    15: [{ title: 'Demo Day', time: '15:00', color: 'bg-red-500' }],
                    18: [{ title: 'Retrospective', time: '16:00', color: 'bg-blue-500' }],
                    22: [{ title: 'Release v2.0', time: '10:00', color: 'bg-emerald-500' }],
                    25: [{ title: 'Sprint Start', time: '09:00', color: 'bg-purple-500' }],
                    28: [{ title: 'Client Meeting', time: '11:00', color: 'bg-amber-500' }],
                };
                const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const startDay = 5; // November 2025 starts on Saturday (index 5 for padding)
                
                return (
                    <div className="p-6 h-full flex flex-col">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="inline-flex items-center gap-3">
                                <button className="text-gray-400 hover:text-white text-lg leading-none">‹</button>
                                <span className="text-lg font-semibold text-white">November 2025</span>
                                <button className="text-gray-400 hover:text-white text-lg leading-none">›</button>
                            </div>
                            <div className="flex bg-white/5 rounded-lg overflow-hidden">
                                {['Day', 'Week', 'Month'].map((view, i) => (
                                    <span key={view} className={`text-xs px-3 py-1.5 ${i === 2 ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>{view}</span>
                                ))}
                            </div>
                        </div>
                        
                        {/* Calendar Grid */}
                        <div className="bg-[#1a1a2e] rounded-lg border border-white/10 overflow-hidden">
                            {/* Week day headers */}
                            <div className="grid grid-cols-7 border-b border-white/10">
                                {weekDays.map(day => (
                                    <div key={day} className="p-2 text-xs text-gray-500 text-center font-medium">
                                        {day}
                    </div>
                                ))}
                </div>
                            
                            {/* Calendar days */}
                            <div className="grid grid-cols-7">
                                {/* Empty cells for padding */}
                                {Array.from({ length: startDay }, (_, i) => (
                                    <div key={`empty-${i}`} className="p-1 min-h-[70px] border-b border-r border-white/5 bg-white/5" />
                                ))}
                                
                                {/* Month days */}
                                {monthDays.map((day, i) => {
                                    const events = monthEvents[day] || [];
                                    const isToday = day === 25;
                                    return (
                         <motion.div
                                            key={day}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={`p-1 min-h-[70px] border-b border-r border-white/5 hover:bg-white/5 transition-colors ${isToday ? 'bg-blue-500/10' : ''}`}
                                        >
                                            <div className={`text-xs mb-1 ${isToday ? 'w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center' : 'text-gray-400 pl-1'}`}>
                                                {day}
                    </div>
                                            <div className="space-y-0.5">
                                                {events.map((event, j) => (
                                                    <motion.div
                                                        key={j}
                                                        initial={{ scaleX: 0 }}
                                                        animate={{ scaleX: 1 }}
                                                        transition={{ delay: 0.3 + j * 0.1 }}
                                                        className={`${event.color} rounded px-1 py-0.5 origin-left`}
                                                    >
                                                        <div className="text-[10px] text-white truncate">{event.title}</div>
                        </motion.div>
                    ))}
                </div>
                                        </motion.div>
                                    );
                                })}
                         </div>
                    </div>
                </div>
                );
            case 'roadmap':
    return (
                    <div className="p-6 h-full flex flex-col">
                        {/* Roadmap Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Roadmap</h3>
                                <p className="text-xs text-gray-500">Project roadmap for this space</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-white/5 rounded-lg overflow-hidden">
                                    {['Day', 'Week', 'Month', 'Quarter'].map((view, i) => (
                                        <span key={view} className={`text-xs px-3 py-1.5 ${i === 2 ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>{view}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Timeline Grid */}
                        <div className="bg-[#1a1a2e] rounded-lg border border-white/10 overflow-hidden relative">
                            {/* Today indicator line - single continuous line */}
                            <div className="absolute top-0 bottom-0 left-[calc(220px+3*(100%-220px)/6+((100%-220px)/6)/2)] w-0.5 bg-red-500 z-10" />
                            
                            {/* Month Headers */}
                            <div className="grid grid-cols-[220px_repeat(6,1fr)] border-b border-white/10">
                                <div className="p-3 text-xs text-gray-500">Tasks</div>
                                {months.map((month, i) => (
                                    <div key={month} className="p-3 text-xs text-gray-400 text-center border-l border-white/5">
                                        <div className="font-medium">{month}</div>
                                        <div className="text-gray-600">{i < 5 ? '2025' : '2026'}</div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Task Rows */}
                            {roadmapTasks.map((task, i) => (
                        <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="grid grid-cols-[220px_1fr] border-b border-white/5 hover:bg-white/5"
                                    style={{ height: '36px' }}
                                >
                                    <div className="px-2 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.color}`} />
                                        <span className="text-xs text-blue-400 whitespace-nowrap">{task.id}</span>
                                        <span className="text-sm text-white">{task.title}</span>
                                    </div>
                                    <div className="relative" style={{ height: '36px' }}>
                                        {/* Month grid lines */}
                                        <div className="absolute inset-0 grid grid-cols-6">
                                            {months.map((_, monthIdx) => (
                                                <div key={monthIdx} className="border-l border-white/5 h-full" />
                                            ))}
                                        </div>
                                        {/* Wrapper for vertical centering */}
                                        <div 
                                            className="absolute flex items-center"
                                            style={{
                                                left: `calc(${(task.startMonth - 1) * 100 / 6}% + 4px)`,
                                                width: `calc(${task.duration * 100 / 6}% - 8px)`,
                                                top: 0,
                                                bottom: 0,
                                            }}
                                        >
                                            {/* Animated task bar */}
                                            <motion.div 
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{ delay: i * 0.05 + 0.2, duration: 0.3 }}
                                                className={`h-6 w-full ${task.color} rounded flex items-center origin-left`}
                                            >
                                                <span className="text-xs text-white font-medium truncate px-2">{task.title}</span>
                                            </motion.div>
                                        </div>
                                    </div>
                        </motion.div>
                    ))}
                </div>
                    </div>
                );
            case 'releases':
                const releases = [
                    { 
                        version: 'v2.4.0', 
                        name: 'Aurora', 
                        status: 'in-progress',
                        date: 'Dec 15, 2025',
                        progress: 68,
                        features: 12,
                        bugs: 5,
                        improvements: 8
                    },
                    { 
                        version: 'v2.3.0', 
                        name: 'Nebula', 
                        status: 'released',
                        date: 'Nov 20, 2025',
                        progress: 100,
                        features: 8,
                        bugs: 12,
                        improvements: 6
                    },
                    { 
                        version: 'v2.2.0', 
                        name: 'Cosmos', 
                        status: 'released',
                        date: 'Oct 15, 2025',
                        progress: 100,
                        features: 15,
                        bugs: 8,
                        improvements: 10
                    },
                ];
                const upcomingFeatures = [
                    { id: 'REL-1', title: 'AI Task Suggestions', type: 'feature', release: 'v2.4.0' },
                    { id: 'REL-2', title: 'Real-time Collaboration', type: 'feature', release: 'v2.4.0' },
                    { id: 'REL-3', title: 'Dashboard Performance Fix', type: 'bug', release: 'v2.4.0' },
                    { id: 'REL-4', title: 'Mobile App Sync', type: 'improvement', release: 'v2.4.0' },
                ];
                return (
                    <div className="p-6 h-full flex flex-col overflow-y-auto">
                        {/* Releases Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-white">Releases</h3>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">3 releases</span>
                            </div>
                            <button className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1">
                                <Rocket className="w-3 h-3" />
                                New Release
                            </button>
                        </div>
                        
                        {/* Current Release */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20 p-4 mb-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Rocket className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-white">{releases[0].version}</span>
                                            <span className="text-sm text-gray-400">"{releases[0].name}"</span>
                                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">In Progress</span>
                                        </div>
                                        <div className="text-xs text-gray-500">Target: {releases[0].date}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-400">{releases[0].progress}%</div>
                                    <div className="text-xs text-gray-500">Complete</div>
                                </div>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${releases[0].progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                />
                         </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-white/5 rounded-lg p-2">
                                    <div className="text-lg font-bold text-emerald-400">{releases[0].features}</div>
                                    <div className="text-xs text-gray-500">Features</div>
                    </div>
                                <div className="bg-white/5 rounded-lg p-2">
                                    <div className="text-lg font-bold text-red-400">{releases[0].bugs}</div>
                                    <div className="text-xs text-gray-500">Bug Fixes</div>
                </div>
                                <div className="bg-white/5 rounded-lg p-2">
                                    <div className="text-lg font-bold text-blue-400">{releases[0].improvements}</div>
                                    <div className="text-xs text-gray-500">Improvements</div>
                                </div>
                            </div>
                        </motion.div>
                        
                        {/* Upcoming Features in Release */}
                        <div className="bg-[#1a1a2e] rounded-lg border border-white/10 mb-4">
                            <div className="p-3 border-b border-white/10 flex items-center justify-between">
                                <span className="text-sm font-medium text-white">Items in {releases[0].version}</span>
                                <span className="text-xs text-gray-500">{upcomingFeatures.length} items</span>
                            </div>
                            <div className="divide-y divide-white/5">
                                {upcomingFeatures.map((feature, i) => (
                                    <motion.div
                                        key={feature.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-3 flex items-center gap-3 hover:bg-white/5 cursor-pointer"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${
                                            feature.type === 'feature' ? 'bg-emerald-500' : 
                                            feature.type === 'bug' ? 'bg-red-500' : 'bg-blue-500'
                                        }`} />
                                        <span className="text-xs text-blue-400 font-mono">{feature.id}</span>
                                        <span className="text-sm text-white flex-1">{feature.title}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            feature.type === 'feature' ? 'bg-emerald-500/20 text-emerald-400' : 
                                            feature.type === 'bug' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>{feature.type}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Past Releases */}
                        <div className="space-y-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Past Releases</span>
                            {releases.slice(1).map((release, i) => (
                                <motion.div
                                    key={release.version}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="bg-[#1a1a2e] rounded-lg border border-white/10 p-3 flex items-center justify-between hover:bg-white/5 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <Rocket className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-white">{release.version}</span>
                                                <span className="text-xs text-gray-400">"{release.name}"</span>
                                            </div>
                                            <div className="text-xs text-gray-500">{release.date}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-emerald-400">{release.features}</div>
                                            <div className="text-xs text-gray-600">features</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-red-400">{release.bugs}</div>
                                            <div className="text-xs text-gray-600">fixes</div>
                                        </div>
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Released</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            case 'sprints':
                const sprintTasks = {
                    todo: [
                        { id: 'TIT-6', title: 'Authentication module', points: 5 },
                        { id: 'TIT-5', title: 'Dashboard analytics', points: 3 },
                    ],
                    inProgress: [
                        { id: 'TIT-4', title: 'Sprint planning AI', points: 8 },
                    ],
                    done: [
                        { id: 'TIT-8', title: 'Design system update', points: 5 },
                        { id: 'TIT-3', title: 'API documentation', points: 3 },
                    ],
                };
    return (
                    <div className="p-6 h-full flex flex-col">
                        {/* Sprint Header */}
                            <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between mb-4 bg-[#1a1a2e] rounded-lg border border-white/10 p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div>
                                    <div className="text-lg font-bold text-white">{sprintData.name}</div>
                                    <div className="text-xs text-gray-500">{sprintData.daysLeft} days remaining</div>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div>
                                    <div className="text-2xl font-bold text-blue-400">{sprintData.velocity}</div>
                                    <div className="text-xs text-gray-500">Story Points</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-sm text-gray-400">Progress</div>
                                    <div className="text-lg font-bold text-white">{sprintData.progress}%</div>
                                </div>
                                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${sprintData.progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                        
                        {/* Sprint Board */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* To Do Column */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-[#1a1a2e] rounded-lg border border-white/10 p-3"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                                    <span className="text-sm font-medium text-white">To Do</span>
                                    <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-full ml-auto">{sprintTasks.todo.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {sprintTasks.todo.map((task, j) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + j * 0.1 }}
                                            className="p-2.5 bg-[#0d0d15] rounded-lg border border-white/5 hover:border-white/20 transition-colors cursor-pointer"
                                        >
                                            <div className="text-xs text-amber-500 mb-1">{task.id}</div>
                                            <div className="text-sm text-white mb-1">{task.title}</div>
                                            <div className="text-xs text-gray-500">{task.points} pts</div>
                                    </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                            
                            {/* In Progress Column */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-[#1a1a2e] rounded-lg border border-blue-500/30 p-3"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    <span className="text-sm font-medium text-white">In Progress</span>
                                    <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full ml-auto">{sprintTasks.inProgress.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {sprintTasks.inProgress.map((task, j) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + j * 0.1 }}
                                            className="p-2.5 bg-[#0d0d15] rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer"
                                        >
                                            <div className="text-xs text-amber-500 mb-1">{task.id}</div>
                                            <div className="text-sm text-white mb-1">{task.title}</div>
                                            <div className="text-xs text-gray-500">{task.points} pts</div>
                            </motion.div>
                        ))}
                    </div>
                            </motion.div>
                            
                            {/* Done Column */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-[#1a1a2e] rounded-lg border border-emerald-500/30 p-3"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-medium text-white">Done</span>
                                    <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full ml-auto">{sprintTasks.done.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {sprintTasks.done.map((task, j) => (
                                <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + j * 0.1 }}
                                            className="p-2.5 bg-[#0d0d15] rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-colors cursor-pointer"
                                        >
                                            <div className="text-xs text-amber-500 mb-1">{task.id}</div>
                                            <div className="text-sm text-white/60 line-through mb-1">{task.title}</div>
                                            <div className="text-xs text-gray-500">{task.points} pts</div>
                            </motion.div>
                        ))}
                    </div>
                            </motion.div>
                </div>
            </div>
                );
            case 'docs':
                return (
                    <div className="p-6 flex gap-4 h-full min-h-0">
                        {/* Tree View Sidebar */}
                            <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-56 bg-[#1a1a2e] rounded-lg border border-white/10 p-3 overflow-y-auto flex-shrink-0 self-stretch"
                        >
                            <div className="text-xs text-gray-500 uppercase mb-3 font-medium">Documents</div>
                            <div className="space-y-1">
                                {/* Project folder */}
                                <div className="text-sm text-gray-400 flex items-center gap-2 py-1">
                                    <span>📁</span> Project
                                </div>
                                <div className="pl-4 space-y-1">
                                    <div className="text-sm text-white flex items-center gap-2 py-1.5 px-2 bg-blue-500/20 rounded cursor-pointer">
                                        <span>📋</span> Product Requirements
                                    </div>
                                    <div className="text-sm text-gray-400 flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer">
                                        <span>🎨</span> Design Guidelines
                                    </div>
                                </div>
                                {/* Technical folder */}
                                <div className="text-sm text-gray-400 flex items-center gap-2 py-1 mt-2">
                                    <span>📁</span> Technical
                                </div>
                                <div className="pl-4 space-y-1">
                                    <div className="text-sm text-gray-400 flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer">
                                        <span>🔌</span> API Documentation
                                    </div>
                                    <div className="text-sm text-gray-400 flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer">
                                        <span>⚙️</span> Architecture
                                    </div>
                                </div>
                                {/* Sprint folder */}
                                <div className="text-sm text-gray-400 flex items-center gap-2 py-1 mt-2">
                                    <span>📁</span> Sprints
                                </div>
                                <div className="pl-4 space-y-1">
                                    <div className="text-sm text-gray-400 flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer">
                                        <span>📝</span> Sprint 24 Notes
                                    </div>
                                    <div className="text-sm text-gray-400 flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer">
                                        <span>📝</span> Sprint 23 Notes
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        
                        {/* Document Preview */}
                                <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex-1 bg-[#1a1a2e] rounded-lg border border-white/10 p-5 overflow-y-auto self-stretch"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <span>📋</span> Product Requirements
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Updated 2 hours ago</span>
                                    <span>•</span>
                                    <span>by Sarah</span>
                                </div>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <h4 className="text-blue-400 font-medium mb-2">Overview</h4>
                                    <p className="text-gray-400 leading-relaxed">
                                        YUMA is an AI-native project management platform designed to automate routine tasks and provide intelligent insights.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-blue-400 font-medium mb-2">Key Features</h4>
                                    <ul className="text-gray-400 space-y-1.5">
                                        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> AI-powered task prioritization</li>
                                        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Automated sprint planning</li>
                                        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Smart documentation</li>
                                        <li className="flex items-center gap-2"><span className="text-amber-400">○</span> Predictive analytics</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-blue-400 font-medium mb-2">Timeline</h4>
                                    <p className="text-gray-400">Phase 1: Q4 2025 • Phase 2: Q1 2026</p>
                                </div>
                            </div>
                            </motion.div>
        </div>
    );
            default:
                return null;
        }
    };

    return (
        <section className="py-32 bg-[#050505] relative z-10 overflow-hidden">
            {/* Section Header */}
            <div className="container mx-auto px-4 mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <p className="text-blue-500 font-mono mb-4">EXPLORE THE PLATFORM</p>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-4">
                        <span className="text-blue-500">Everything you need</span> to manage work
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        See how YUMA brings together all your project management needs in one intelligent platform
                    </p>
                </motion.div>
            </div>

            {/* Interactive App Demo */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="max-w-6xl mx-auto px-4"
            >
                    {/* App View Frame */}
                    <div className="bg-[#0d0d15] rounded-xl overflow-hidden border border-white/10">
                        {/* Tab Navigation - App Style */}
                        <div className="flex items-center gap-1 px-4 py-3 border-b border-white/10 bg-[#0a0a12] overflow-x-auto">
                            {tabs.map((tab, i) => {
                                const isMore = tab.id === 'more';
                                const isClickable = tab.clickable || isMore;
                                
                                return (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => handleTabClick(i)}
                                        disabled={!tab.clickable}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                                            !isClickable
                                                ? 'text-gray-600 cursor-not-allowed opacity-50'
                                                : activeTab === i
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                        whileHover={isClickable ? { scale: 1.02 } : {}}
                                        whileTap={isClickable && tab.clickable ? { scale: 0.98 } : {}}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div className="h-[500px] bg-[#0d0d15] flex flex-col">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1 flex flex-col min-h-0"
                                >
                                    {renderContent()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
        </section>
    );
}

// --- Main Page Component ---
export default function LandingPage() {
    const router = useRouter();
    
    // Prefetch auth pages for faster navigation
    useEffect(() => {
        router.prefetch('/auth?mode=signup');
        router.prefetch('/auth?mode=login');
        router.prefetch('/home');
    }, [router]);

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] overflow-x-hidden">
            {/* NEUROLINKS BACKGROUND - Interactive neural network effect */}
            <NeurolinksBackground />
            
            {/* HERO SECTION */}
            <section className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20">
                 {/* Ambient Background */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Radial gradient mesh */}
                    <div className="absolute inset-0 bg-gradient-radial from-blue-950/20 via-transparent to-transparent opacity-60" />
                    
                    {/* Subtle glows positioned behind content */}
                    <motion.div 
                        className="absolute top-[20%] left-[15%] w-[400px] h-[400px] bg-gradient-to-br from-blue-500/8 to-transparent rounded-full blur-[100px]"
                        animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.4, 0.7, 0.4]
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div 
                        className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] bg-gradient-to-tl from-purple-500/8 to-transparent rounded-full blur-[90px]"
                        animate={{ 
                            scale: [1, 1.15, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    />
                    
                    {/* Grid overlay */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                    
                    {/* Noise texture for organic feel */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent mix-blend-overlay" />
                    
                    <ParticleSystem />
                </div>

                <div className="relative z-10 space-y-6 max-w-5xl mx-auto">
                    <div className="overflow-hidden">
                        <MaskedText className="text-[10vw] md:text-[8vw] leading-[0.9] font-bold tracking-tighter text-white mix-blend-difference" useAnimate={true}>
                            BUILT BY AI.
                        </MaskedText>
                    </div>
                    <div className="overflow-hidden">
                        <MaskedText className="text-[10vw] md:text-[8vw] leading-[0.9] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient" delay={0.2} useAnimate={true}>
                            FOR HUMANS.
                        </MaskedText>
                    </div>
                    
                    <motion.p 
                        className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mt-8 leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 1 }}
                    >
                        Focus on the work that matters — everything else organizes, predicts, and documents itself.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 1, duration: 1 }} 
                        className="flex items-center justify-center gap-8 mt-12 relative"
                    >
                        <Magnetic>
                            <Link href="/auth?mode=signup">
                                <Button className="h-16 px-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 text-xl font-bold transition-all hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/60 shadow-lg shadow-blue-500/50 relative z-10">
                                    Start for Free
                                </Button>
                            </Link>
                        </Magnetic>
                        <Magnetic>
                            <Link href="/auth?mode=login">
                                <Button className="h-16 px-10 rounded-full bg-white text-black hover:bg-gray-100 text-xl font-bold transition-all hover:scale-110 hover:shadow-2xl hover:shadow-white/30 shadow-lg shadow-white/20 relative z-10">
                                    Login
                                </Button>
                            </Link>
                        </Magnetic>
                    </motion.div>
                </div>

                 {/* Scroll Indicator */}
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
                 >
                    <motion.span 
                        className="text-xs uppercase tracking-widest"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        Scroll to Explore
                    </motion.span>
                    <motion.div 
                        className="w-px h-12 bg-gradient-to-b from-gray-500 to-transparent"
                        animate={{ height: [48, 32, 48] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                 </motion.div>
            </section>

            {/* FEATURE SEQUENCE */}
            <FeatureSequence />

            {/* AI MANIFESTO SECTION */}
            <section className="py-40 bg-[#050505] relative z-10 overflow-hidden">
                <ParticleSystem />
                <div className="container mx-auto px-4 relative">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-stretch">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <motion.h2 
                                className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-8 text-white drop-shadow-[0_10px_35px_rgba(8,8,8,0.8)]"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                WE DIDN'T JUST <br/>
                                <motion.span 
                                    className="text-blue-500"
                                    animate={{ 
                                        textShadow: [
                                            "0 0 20px rgba(59, 130, 246, 0.5)",
                                            "0 0 40px rgba(59, 130, 246, 0.8)",
                                            "0 0 20px rgba(59, 130, 246, 0.5)"
                                        ]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    ADD AI.
                                </motion.span> <br/>
                                WE STARTED <br/>
                                WITH IT.
                            </motion.h2>
                            <motion.p 
                                className="text-xl text-gray-400 leading-relaxed mb-8"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                AI isn't an add-on here — it's the origin story. 
                                <br/><br/>
                                Every line of code, every feature, and every interaction was conceived to bridge the gap between human creativity and machine efficiency.
                            </motion.p>
                             <ul className="space-y-4">
                                {[
                                    "Self-organizing workspaces",
                                    "Context-aware documentation",
                                    "Automated sprint management",
                                    "Predictive analytics"
                                ].map((item, i) => (
                                    <motion.li 
                                        key={i} 
                                        className="flex items-center gap-4 text-lg"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                                        whileHover={{ x: 10, scale: 1.02 }}
                                    >
                                        <motion.div 
                                            className="w-2 h-2 bg-blue-500 rounded-full"
                                            animate={{ scale: [1, 1.5, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                        />
                                        {item}
                                    </motion.li>
                                ))}
                             </ul>
                        </motion.div>
                        <motion.div 
                            className="h-full min-h-[700px]"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                             <HeroVisual />
                        </motion.div>
                     </div>
                </div>
            </section>

            {/* TESTIMONIAL / STATS (Made by AI point) */}
            <section className="py-32 border-y border-white/5 bg-[#080808] relative z-10 overflow-hidden">
                <FloatingOrb delay={0} size={300} color="blue" />
                <FloatingOrb delay={5} size={250} color="purple" />
                <FloatingOrb delay={10} size={200} color="green" />
                <div className="container mx-auto px-4 text-center relative z-10">
                     <motion.p 
                        className="text-blue-500 font-mono mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                     >
                        THE SINGULARITY IS NEAR
                     </motion.p>
                     <motion.h2 
                        className="text-4xl md:text-6xl font-bold tracking-tight mb-16 max-w-4xl mx-auto text-white drop-shadow-[0_10px_35px_rgba(8,8,8,0.8)]"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                     >
                        &quot;The only platform where the{' '}
                        <span className="text-blue-500">software works harder than you</span>
                        {' '}do.&quot;
                     </motion.h2>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: "Reduction in Admin Work", value: 80, suffix: "%" },
                            { label: "Faster Sprint Planning", value: 10, suffix: "x" },
                            { label: "AI Accuracy", value: 99.9, suffix: "%" }
                        ].map((stat, i) => (
                            <motion.div 
                                key={i} 
                                className="p-8 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-default relative overflow-hidden group"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                                whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                            >
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500"
                                />
                                <div className="relative z-10">
                                    <motion.div 
                                        className="text-6xl font-bold text-white mb-2"
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: 0.6 + i * 0.1, type: "spring", stiffness: 200 }}
                                    >
                                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                    </motion.div>
                                    <div className="text-gray-400">{stat.label}</div>
                                </div>
                            </motion.div>
                        ))}
                     </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 text-center relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent z-0" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center"
                    >
                        <motion.h2 
                            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-white"
                            animate={{ 
                                textShadow: [
                                    "0 0 20px rgba(59, 130, 246, 0.3)",
                                    "0 0 40px rgba(59, 130, 246, 0.5)",
                                    "0 0 20px rgba(59, 130, 246, 0.3)"
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                         >
                            Ready to <span className="text-blue-500">evolve</span>?
                        </motion.h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-xl">
                            Join thousands of teams who have transformed their workflow with YUMA.
                        </p>
                            <Link href="/auth?mode=signup">
                                <motion.div
                                whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                <Button className="h-16 px-12 rounded-full bg-blue-600 text-white text-xl font-bold hover:bg-blue-500 transition-all shadow-[0_0_50px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_80px_-10px_rgba(37,99,235,0.8)]">
                                            Get Started Now
                                    </Button>
                                </motion.div>
                            </Link>
                    </motion.div>
                </div>
            </section>

             <motion.footer 
                className="relative z-10 py-8 border-t border-white/10 text-center text-gray-600 text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
             >
                <motion.p
                    animate={{ 
                        opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    &copy; 2024 YUMA. Made by AI, for People.
                </motion.p>
            </motion.footer>
        </div>
    );
}
