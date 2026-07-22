// codex: 2026-07-22 Display keyboard adjustment and execution feedback for the active cut point P.
/**
 * Renderer class to draw triangles, angle arcs, labels, cut lines, P-sides angles, and animations.
 * Supports high-DPI displays (4K/2K), dynamic resize, and safe margin bounds.
 */
class TriangleRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 800;
        this.height = 500;

        this.hoverPoint = null;
        this.hoverEdgeIndex = -1;
        this.hoverT = 0;
        this.hoverSnapAngle = null;
        this.keyboardAngleTarget = null;
        this.selectedCutPoint = null;
        this.animatingDiscard = null;

        this.setupResizing();
    }

    setupResizing() {
        this.resize = () => {
            if (!this.canvas || !this.canvas.parentElement) return;
            const parent = this.canvas.parentElement;
            const dpr = window.devicePixelRatio || 1;
            if (parent.clientWidth === 0 || parent.clientHeight === 0) return false;

            this.width = parent.clientWidth;
            this.height = parent.clientHeight;

            this.canvas.width = Math.floor(this.width * dpr);
            this.canvas.height = Math.floor(this.height * dpr);
            this.canvas.style.width = `${this.width}px`;
            this.canvas.style.height = `${this.height}px`;

            // Reset transform matrix for accurate high-DPI scaling
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return true;
        };

        this.resize();
        this.handleLayoutChange = () => {
            if (this.resize() && this.onResize) this.onResize();
        };
        window.addEventListener('resize', this.handleLayoutChange);
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(this.handleLayoutChange);
            this.resizeObserver.observe(this.canvas.parentElement);
        }
    }

    getScaledVertices(rawVertices) {
        const displayVertices = orientVerticesForDisplay(rawVertices);
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        displayVertices.forEach(v => {
            if (v.x < minX) minX = v.x;
            if (v.x > maxX) maxX = v.x;
            if (v.y < minY) minY = v.y;
            if (v.y > maxY) maxY = v.y;
        });

        const boundsW = maxX - minX || 1;
        const boundsH = maxY - minY || 1;

        const padX = Math.max(45, this.width * 0.06);
        const padY = Math.max(45, this.height * 0.08);

        const availW = Math.max(100, this.width - 2 * padX);
        const availH = Math.max(100, this.height - 2 * padY);

        const scale = Math.min(availW / boundsW, availH / boundsH);

        const offsetX = (this.width - boundsW * scale) / 2 - minX * scale;
        const offsetY = (this.height - boundsH * scale) / 2 - minY * scale;

        return displayVertices.map(v => ({
            x: v.x * scale + offsetX,
            y: v.y * scale + offsetY
        }));
    }

    render(rawVertices, theta, options = {}) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const scaled = this.getScaledVertices(rawVertices);
        const angles = calculateTriangleAngles(rawVertices);

        // Draw Triangle Body
        this.drawTrianglePolygon(scaled, options);

        // Draw Angle Arcs and Labels for vertices
        this.drawAngles(scaled, rawVertices, angles, theta);

        // Draw Cut Preview and both endpoint angle annotations.
        if (options.pendingSplit) {
            this.drawPendingSplit(scaled, rawVertices, options.pendingSplit, theta);
        } else if (options.previewCut) {
            this.drawCutPreview(scaled, rawVertices, options.previewCut, theta);
        } else if (this.hoverPoint && options.enableCutHover) {
            this.drawCutHover(scaled, rawVertices, this.hoverEdgeIndex, this.hoverT, theta);
        }
    }

    drawTrianglePolygon(vertices, options) {
        const [A, B, C] = vertices;

        const grad = this.ctx.createLinearGradient(A.x, A.y, B.x, C.y);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
        grad.addColorStop(1, 'rgba(129, 140, 248, 0.12)');

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(A.x, A.y);
        this.ctx.lineTo(B.x, B.y);
        this.ctx.lineTo(C.x, C.y);
        this.ctx.closePath();

        this.ctx.fillStyle = grad;
        this.ctx.fill();

        this.ctx.lineWidth = 3.5;
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
        this.ctx.shadowBlur = 14;
        this.ctx.stroke();

        // Vertices dots
        vertices.forEach((V, idx) => {
            const labels = ['A', 'B', 'C'];
            const vertexLabel = V.isCutPoint ? 'P' : labels[idx];
            this.ctx.beginPath();
            this.ctx.arc(V.x, V.y, 7, 0, Math.PI * 2);
            this.ctx.fillStyle = '#00f3ff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            this.ctx.font = 'bold 17px Outfit, sans-serif';
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.shadowColor = 'rgba(0,0,0,0.9)';
            this.ctx.shadowBlur = 5;

            const dirX = V.x - (A.x + B.x + C.x) / 3;
            const dirY = V.y - (A.y + B.y + C.y) / 3;
            const len = Math.hypot(dirX, dirY) || 1;
            this.ctx.fillText(vertexLabel, V.x + (dirX / len) * 24 - 6, V.y + (dirY / len) * 24 + 6);
        });

        this.ctx.restore();
    }

    drawAngles(scaledVertices, rawVertices, angles, theta) {
        scaledVertices.forEach((V, idx) => {
            const prev = scaledVertices[(idx + 2) % 3];
            const next = scaledVertices[(idx + 1) % 3];
            const angObj = angles[idx];
            const angleVal = angObj.angle;

            const safety = checkAngleSafety(angleVal, theta);

            const v1 = { x: prev.x - V.x, y: prev.y - V.y };
            const v2 = { x: next.x - V.x, y: next.y - V.y };
            const a1 = Math.atan2(v1.y, v1.x);
            const a2 = Math.atan2(v2.y, v2.x);

            const arc = getInteriorArcGeometry(a1, a2, angleVal);

            const arcRadius = 34;

            let arcColor = '#38bdf8';
            let badgeText = `${angleVal.toFixed(1)}°`;

            if (safety.isExactTheta) {
                arcColor = '#ffb703';
                badgeText = `🎯 ${angleVal.toFixed(1)}° (θ!)`;
            } else if (safety.isUnsafe) {
                arcColor = '#ff2e93';
                badgeText = `⚠️ ${angleVal.toFixed(1)}° (${safety.k}θ)`;
            }

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(V.x, V.y, arcRadius, arc.startAngle, arc.endAngle);
            this.ctx.strokeStyle = arcColor;
            this.ctx.lineWidth = safety.isExactTheta ? 5 : 3.5;
            if (safety.isExactTheta) {
                this.ctx.shadowColor = '#ffb703';
                this.ctx.shadowBlur = 18;
            }
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(V.x, V.y);
            this.ctx.arc(V.x, V.y, arcRadius, arc.startAngle, arc.endAngle);
            this.ctx.fillStyle = arcColor === '#ffb703' ? 'rgba(255, 183, 3, 0.25)' :
                                 arcColor === '#ff2e93' ? 'rgba(255, 46, 147, 0.20)' : 'rgba(56, 189, 248, 0.12)';
            this.ctx.fill();

            const midAngle = arc.midAngle;
            const textRadius = arcRadius + 26;
            const tx = V.x + Math.cos(midAngle) * textRadius;
            const ty = V.y + Math.sin(midAngle) * textRadius;

            this.ctx.font = '600 13px Inter, sans-serif';
            this.ctx.fillStyle = arcColor;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(badgeText, tx, ty);

            this.ctx.restore();
        });
    }

    drawCutHover(scaledVertices, rawVertices, edgeIndex, t, theta) {
        if (edgeIndex < 0) return;
        const v0 = scaledVertices[edgeIndex];
        const v1 = scaledVertices[(edgeIndex + 1) % 3];
        const vOpp = scaledVertices[(edgeIndex + 2) % 3];

        const P_scaled = {
            x: v0.x + (v1.x - v0.x) * t,
            y: v0.y + (v1.y - v0.y) * t
        };

        this.ctx.save();

        this.ctx.beginPath();
        this.ctx.setLineDash([6, 6]);
        this.ctx.moveTo(P_scaled.x, P_scaled.y);
        this.ctx.lineTo(vOpp.x, vOpp.y);
        this.ctx.strokeStyle = '#facc15';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(P_scaled.x, P_scaled.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#facc15';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        this.drawCutPointLabel(P_scaled);

        this.drawPAngles(P_scaled, v0, v1, vOpp, rawVertices, edgeIndex, t, theta);
        if (this.hoverSnapAngle) {
            this.ctx.font = '700 12px Inter, sans-serif';
            this.ctx.fillStyle = '#facc15';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`吸附 ${this.hoverSnapAngle.toFixed(0)}°`, P_scaled.x, P_scaled.y - 28);
        }
        if (this.keyboardAngleTarget !== null) {
            this.ctx.font = '700 12px Inter, sans-serif';
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `←/→ 调整 ∠P₁：${this.keyboardAngleTarget.toFixed(1)}° · 空格执行`,
                P_scaled.x,
                P_scaled.y - 46
            );
        }
        this.drawVertexSplitAngles(vOpp, v0, v1, P_scaled, rawVertices, edgeIndex, t, theta);

        this.ctx.restore();
    }

    drawCutPreview(scaledVertices, rawVertices, cut, theta) {
        const vOpp = scaledVertices[(cut.edgeIndex + 2) % 3];
        const v0 = scaledVertices[cut.edgeIndex];
        const v1 = scaledVertices[(cut.edgeIndex + 1) % 3];

        const P_scaled = {
            x: v0.x + (v1.x - v0.x) * cut.t,
            y: v0.y + (v1.y - v0.y) * cut.t
        };

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(P_scaled.x, P_scaled.y);
        this.ctx.lineTo(vOpp.x, vOpp.y);
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 12;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(P_scaled.x, P_scaled.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        this.drawCutPointLabel(P_scaled);

        this.drawPAngles(P_scaled, v0, v1, vOpp, rawVertices, cut.edgeIndex, cut.t, theta);
        this.drawVertexSplitAngles(
            vOpp,
            v0,
            v1,
            P_scaled,
            rawVertices,
            cut.edgeIndex,
            cut.t,
            theta
        );

        this.ctx.restore();
    }

    drawPendingSplit(scaledVertices, rawVertices, pendingSplit, theta) {
        const { edgeIndex, t } = pendingSplit;
        const v0 = scaledVertices[edgeIndex];
        const v1 = scaledVertices[(edgeIndex + 1) % 3];
        const vOpp = scaledVertices[(edgeIndex + 2) % 3];
        const P = {
            x: v0.x + (v1.x - v0.x) * t,
            y: v0.y + (v1.y - v0.y) * t
        };
        const presentations = getPendingSplitPresentation();
        const triangles = [[v0, P, vOpp], [P, v1, vOpp]];

        this.ctx.save();
        triangles.forEach((triangle, index) => {
            const presentation = presentations[index];
            this.ctx.beginPath();
            this.ctx.moveTo(triangle[0].x, triangle[0].y);
            this.ctx.lineTo(triangle[1].x, triangle[1].y);
            this.ctx.lineTo(triangle[2].x, triangle[2].y);
            this.ctx.closePath();
            this.ctx.fillStyle = presentation.fillColor;
            this.ctx.fill();
            this.ctx.strokeStyle = presentation.strokeColor;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            const centerX = triangle.reduce((sum, point) => sum + point.x, 0) / 3;
            const centerY = triangle.reduce((sum, point) => sum + point.y, 0) / 3;
            this.ctx.font = '700 16px Outfit, sans-serif';
            this.ctx.fillStyle = presentation.strokeColor;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(presentation.label, centerX, centerY);
        });

        this.ctx.beginPath();
        this.ctx.setLineDash([6, 6]);
        this.ctx.moveTo(P.x, P.y);
        this.ctx.lineTo(vOpp.x, vOpp.y);
        this.ctx.strokeStyle = '#facc15';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.beginPath();
        this.ctx.arc(P.x, P.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#facc15';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        this.drawCutPointLabel(P);

        this.drawPAngles(P, v0, v1, vOpp, rawVertices, edgeIndex, t, theta);
        this.drawVertexSplitAngles(vOpp, v0, v1, P, rawVertices, edgeIndex, t, theta);
        this.ctx.restore();
    }

    drawPAngles(P, v0, v1, vOpp, rawVertices, edgeIndex, t, theta) {
        const pAngles = calculateCutPointAngles(rawVertices, edgeIndex, t);

        const aPB = Math.atan2(v0.y - P.y, v0.x - P.x);
        const aPC = Math.atan2(v1.y - P.y, v1.x - P.x);
        const aPA = Math.atan2(vOpp.y - P.y, vOpp.x - P.x);

        const arcRadius = 26;

        const safety1 = checkAngleSafety(pAngles.angleP1, theta);
        let color1 = safety1.isExactTheta ? '#ffb703' : safety1.isUnsafe ? '#ff2e93' : '#00f3ff';

        const arc1 = getInteriorArcGeometry(aPB, aPA, pAngles.angleP1);
        this.ctx.beginPath();
        this.ctx.arc(P.x, P.y, arcRadius, arc1.startAngle, arc1.endAngle);
        this.ctx.strokeStyle = color1;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        const mid1 = arc1.midAngle;
        const t1x = P.x + Math.cos(mid1) * (arcRadius + 20);
        const t1y = P.y + Math.sin(mid1) * (arcRadius + 20);

        this.ctx.font = '600 12px Inter, sans-serif';
        this.ctx.fillStyle = color1;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`∠P₁: ${pAngles.angleP1.toFixed(1)}°`, t1x, t1y);

        const safety2 = checkAngleSafety(pAngles.angleP2, theta);
        let color2 = safety2.isExactTheta ? '#ffb703' : safety2.isUnsafe ? '#ff2e93' : '#00f3ff';

        const arc2 = getInteriorArcGeometry(aPC, aPA, pAngles.angleP2);
        this.ctx.beginPath();
        this.ctx.arc(P.x, P.y, arcRadius, arc2.startAngle, arc2.endAngle);
        this.ctx.strokeStyle = color2;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        const mid2 = arc2.midAngle;
        const t2x = P.x + Math.cos(mid2) * (arcRadius + 20);
        const t2y = P.y + Math.sin(mid2) * (arcRadius + 20);

        this.ctx.font = '600 12px Inter, sans-serif';
        this.ctx.fillStyle = color2;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`∠P₂: ${pAngles.angleP2.toFixed(1)}°`, t2x, t2y);
    }

    drawVertexSplitAngles(V, v0, v1, P, rawVertices, edgeIndex, t, theta) {
        const vertexAngles = calculateCutVertexAngles(rawVertices, edgeIndex, t);
        const vertexLabel = ['A', 'B', 'C'][vertexAngles.vertexIndex];
        const aVP = Math.atan2(P.y - V.y, P.x - V.x);
        const aV0 = Math.atan2(v0.y - V.y, v0.x - V.x);
        const aV1 = Math.atan2(v1.y - V.y, v1.x - V.x);
        const annotations = [
            { suffix: '₁', angle: vertexAngles.angleV1, first: aVP, second: aV0, radius: 44 },
            { suffix: '₂', angle: vertexAngles.angleV2, first: aVP, second: aV1, radius: 62 }
        ];

        annotations.forEach(annotation => {
            const safety = checkAngleSafety(annotation.angle, theta);
            const color = safety.isExactTheta ? '#ffb703' :
                safety.isUnsafe ? '#ff2e93' : '#00f3ff';
            const arc = getInteriorArcGeometry(
                annotation.first,
                annotation.second,
                annotation.angle
            );
            this.ctx.beginPath();
            this.ctx.arc(V.x, V.y, annotation.radius, arc.startAngle, arc.endAngle);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            const textRadius = annotation.radius + 19;
            this.ctx.font = '600 12px Inter, sans-serif';
            this.ctx.fillStyle = color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                `∠${vertexLabel}${annotation.suffix}: ${annotation.angle.toFixed(1)}°`,
                V.x + Math.cos(arc.midAngle) * textRadius,
                V.y + Math.sin(arc.midAngle) * textRadius
            );
        });
    }

    drawCutPointLabel(P) {
        this.ctx.font = '700 16px Outfit, sans-serif';
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('P', P.x + 12, P.y - 9);
    }
}

/**
 * Chooses the direction whose circular span matches a calculated interior angle.
 */
function getInteriorArcGeometry(firstAngle, secondAngle, targetDegrees) {
    const fullTurn = Math.PI * 2;
    const targetRadians = targetDegrees * Math.PI / 180;
    const forwardSpan = ((secondAngle - firstAngle) % fullTurn + fullTurn) % fullTurn;
    const reverseSpan = fullTurn - forwardSpan;
    const useForward = Math.abs(forwardSpan - targetRadians) <=
        Math.abs(reverseSpan - targetRadians);
    const startAngle = useForward ? firstAngle : secondAngle;
    const span = useForward ? forwardSpan : reverseSpan;

    return {
        startAngle,
        endAngle: startAngle + span,
        midAngle: startAngle + span / 2
    };
}

/**
 * Supplies stable labels and colors for the two selectable cut results.
 */
function getPendingSplitPresentation() {
    return [
        { label: 'T₁ 绿色候选', fillColor: 'rgba(16, 185, 129, 0.34)', strokeColor: '#10b981' },
        { label: 'T₂ 红色候选', fillColor: 'rgba(239, 68, 68, 0.32)', strokeColor: '#ef4444' }
    ];
}

/**
 * Rotates the longest triangle edge horizontally for a larger, undistorted view.
 */
function orientVerticesForDisplay(vertices) {
    let longestStart = vertices[0];
    let longestEnd = vertices[1];
    let longestLength = 0;
    for (let index = 0; index < 3; index++) {
        const start = vertices[index];
        const end = vertices[(index + 1) % 3];
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        if (length > longestLength) {
            longestLength = length;
            longestStart = start;
            longestEnd = end;
        }
    }
    const center = vertices.reduce(
        (sum, vertex) => ({ x: sum.x + vertex.x / 3, y: sum.y + vertex.y / 3 }),
        { x: 0, y: 0 }
    );
    const rotation = -Math.atan2(
        longestEnd.y - longestStart.y,
        longestEnd.x - longestStart.x
    );
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    return vertices.map(vertex => {
        const x = vertex.x - center.x;
        const y = vertex.y - center.y;
        return {
            x: x * cosine - y * sine,
            y: x * sine + y * cosine
        };
    });
}

/**
 * Converts viewport pointer coordinates to the renderer's CSS-pixel space.
 */
function getCanvasPointFromClient(clientX, clientY, rect, canvasWidth, canvasHeight) {
    return {
        x: (clientX - rect.left) * canvasWidth / rect.width,
        y: (clientY - rect.top) * canvasHeight / rect.height
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TriangleRenderer,
        getCanvasPointFromClient,
        getInteriorArcGeometry,
        getPendingSplitPresentation,
        orientVerticesForDisplay
    };
}
