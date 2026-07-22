# codex: 2026-07-22 Check exact altitude math for demo steps
import math

def check_triangle(a, b, c):
    def dist(p1, p2):
        return math.hypot(p1[0]-p2[0], p1[1]-p2[1])

    # Altitude from A to BC
    # B = (0,0), C = (8,0), A = (2,5)
    px, py = a[0], b[1] # Drop to x-axis
    p = (px, py)

    # Vector PA, PB, PC
    pa = (a[0]-p[0], a[1]-p[1])
    pb = (b[0]-p[0], b[1]-p[1])
    pc = (c[0]-p[0], c[1]-p[1])

    mag_pa = math.hypot(*pa)
    mag_pb = math.hypot(*pb)
    mag_pc = math.hypot(*pc)

    cos1 = (pa[0]*pb[0] + pa[1]*pb[1]) / (mag_pa * mag_pb)
    cos2 = (pa[0]*pc[0] + pa[1]*pc[1]) / (mag_pa * mag_pc)

    ang1 = math.degrees(math.acos(cos1))
    ang2 = math.degrees(math.acos(cos2))

    print(f"P = {p}")
    print(f"Angle APB = {ang1:.2f}°")
    print(f"Angle APC = {ang2:.2f}°")

if __name__ == "__main__":
    check_triangle((2, 5), (0, 0), (8, 0))
