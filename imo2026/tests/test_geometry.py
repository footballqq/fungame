# codex: 2026-07-22 test geometry logic for IMO 2026 P4 including P point angle calculation
import math
import pytest

EPSILON = 1e-4

def is_valid_theta(theta_deg):
    if theta_deg <= 0 or theta_deg >= 180:
        return False
    n = round(180.0 / theta_deg)
    return n >= 2 and abs(180.0 / n - theta_deg) < EPSILON

def is_angle_unsafe(angle_deg, theta_deg):
    k = round(angle_deg / theta_deg)
    return k >= 1 and abs(k * theta_deg - angle_deg) < EPSILON

def get_triangle_angles(a, b, c):
    def distance(p1, p2):
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    lab = distance(a, b)
    lbc = distance(b, c)
    lca = distance(c, a)

    cos_A = max(-1.0, min(1.0, (lab**2 + lca**2 - lbc**2) / (2 * lab * lca)))
    cos_B = max(-1.0, min(1.0, (lab**2 + lbc**2 - lca**2) / (2 * lab * lbc)))
    cos_C = max(-1.0, min(1.0, (lbc**2 + lca**2 - lab**2) / (2 * lbc * lca)))

    ang_A = math.degrees(math.acos(cos_A))
    ang_B = math.degrees(math.acos(cos_B))
    ang_C = math.degrees(math.acos(cos_C))
    return ang_A, ang_B, ang_C

def get_cut_point_angles(a, b, c, edge_index, t):
    """
    Given triangle ABC, cut point P on edgeIndex with parameter t (0 < t < 1),
    compute the two angles at P on both sides of line AP.
    """
    vertices = [a, b, c]
    v0 = vertices[edge_index]
    v1 = vertices[(edge_index + 1) % 3]
    v_opp = vertices[(edge_index + 2) % 3]

    px = v0[0] + (v1[0] - v0[0]) * t
    py = v0[1] + (v1[1] - v0[1]) * t
    p = (px, py)

    v_pa = (v_opp[0] - p[0], v_opp[1] - p[1])
    v_pb = (v0[0] - p[0], v0[1] - p[1])
    v_pc = (v1[0] - p[0], v1[1] - p[1])

    mag_pa = math.hypot(*v_pa)
    mag_pb = math.hypot(*v_pb)
    mag_pc = math.hypot(*v_pc)

    cos_1 = max(-1.0, min(1.0, (v_pa[0]*v_pb[0] + v_pa[1]*v_pb[1]) / (mag_pa * mag_pb)))
    cos_2 = max(-1.0, min(1.0, (v_pa[0]*v_pc[0] + v_pa[1]*v_pc[1]) / (mag_pa * mag_pc)))

    ang_1 = math.degrees(math.acos(cos_1))
    ang_2 = math.degrees(math.acos(cos_2))
    return ang_1, ang_2

# --- Pytest Cases ---

def test_valid_theta():
    assert is_valid_theta(90.0) is True
    assert is_valid_theta(60.0) is True
    assert is_valid_theta(45.0) is True
    assert is_valid_theta(50.0) is False

def test_cut_point_angles():
    a, b, c = (0.0, 4.0), (0.0, 0.0), (4.0, 0.0) # Right isosceles triangle
    # Cut on BC (edgeIndex 1) at t = 0.5 (point (2,0))
    ang1, ang2 = get_cut_point_angles(a, b, c, 1, 0.5)
    # P is (2,0), A is (0,4), B is (0,0), C is (4,0)
    # Line AP is altitude to BC? Wait, BC is from (0,0) to (4,0). AP goes from (2,0) to (0,4).
    # ang1 + ang2 must equal 180 deg
    assert abs((ang1 + ang2) - 180.0) < EPSILON
